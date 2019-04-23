/**
* A Lambda function that does a round-robin safe select for an index beyond the end of a list of objects.\
**/

var aws = require("aws-sdk");
 
exports.handler = function(event, context) {
 
    console.log("REQUEST RECEIVED:\n" + JSON.stringify(event));
    
    // For Delete requests, immediately send a SUCCESS response.
    if (event.RequestType == "Delete") {
        sendResponse(event, context, "SUCCESS");
        return;
    }
 
    var responseStatus = "FAILED";
    var responseData = {};
 
    var index = parseInt(event.ResourceProperties.Index);
    console.log("Index: " + index.toString())
    var listOfObjects = event.ResourceProperties.ListOfObjects;
    var maxSelect = listOfObjects.length;
    console.log("Maximum Select Value: " + maxSelect.toString())
    var modRemainder = index % maxSelect;
    if (modRemainder < 0) { modRemainder = maxSelect + modRemainder }
    console.log("Index of Selected to Return: " + modRemainder.toString())

    responseStatus = "SUCCESS";
    responseData["Selected"] = listOfObjects[modRemainder];
    console.log("Selected: " + responseData["Selected"])
    sendResponse(event, context, responseStatus, responseData);
};

// Send response to the pre-signed S3 URL 
function sendResponse(event, context, responseStatus, responseData) {
 
    var responseBody = JSON.stringify({
        Status: responseStatus,
        Reason: "See the details in CloudWatch Log Stream: " + context.logStreamName,
        PhysicalResourceId: context.logStreamName,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        Data: responseData
    });
 
    console.log("RESPONSE BODY:\n", responseBody);
 
    var https = require("https");
    var url = require("url");
 
    var parsedUrl = url.parse(event.ResponseURL);
    var options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: "PUT",
        headers: {
            "content-type": "",
            "content-length": responseBody.length
        }
    };
 
    console.log("SENDING RESPONSE...\n");
 
    var request = https.request(options, function(response) {
        console.log("STATUS: " + response.statusCode);
        console.log("HEADERS: " + JSON.stringify(response.headers));
        // Tell AWS Lambda that the function execution is done  
        context.done();
    });
 
    request.on("error", function(error) {
        console.log("sendResponse Error:" + error);
        // Tell AWS Lambda that the function execution is done  
        context.done();
    });
  
    // write data to request body
    request.write(responseBody);
    request.end();
}
