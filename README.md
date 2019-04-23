# SafeSelect

SafeSelect is an AWS Lambda function designed to assist DevOps engineers 
in deploying resources using CloudFormation templates across availability zones 
(AZs) without hard-coding the number of availability zones in maps and using 
Fn::FindInMap.  

## Purpose

Many existing solutions use maps to hard-code information regarding the number of 
availability zones within a region:
```
...
"AWSRegion2AZ": {
    "ap-northeast-1": {
        "Name": "Tokyo",
        "NumAZs": "2",
        "AZ0": "0",
        "AZ1": "1",
        "AZ2": "0"
    },
    "ap-northeast-2": {
        "Name": "Seoul",
        "NumAZs": "2",
        "AZ0": "0",
        "AZ1": "1",
        "AZ2": "0"
    },
    ...
    "us-west-1": {
        "Name": "N. California",
        "NumAZs": "2",
        "AZ0": "0",
        "AZ1": "1",
        "AZ2": "0"
    },
    "us-west-2": {
        "Name": "Oregon",
        "NumAZs": "3",
        "AZ0": "0",
        "AZ1": "1",
        "AZ2": "2"
    }
}
...
"PubSubnetAz1" : {
    "DependsOn" : "Vpc",
    "Type" : "AWS::EC2::Subnet",
    "Properties" : {
        "VpcId" : { "Ref" : "Vpc" },
        "CidrBlock" : { "Fn::FindInMap" : [ "VpcCidrs", "pubsubnet1", "cidr" ] },
        "AvailabilityZone" : { "Fn::Select" : [
            {"Fn::FindInMap": ["AWSRegion2AZ", { "Ref": "AWS::Region" }, "AZ0"]},
            { "Fn::GetAZs" : { "Ref" : "AWS::Region" } } ] },
        "Tags": [
            { "Key" : "Name", "Value" : { "Fn::Join": [ "-", [ { "Ref": "AWS::StackName"}, "Subnet1"] ] } }
        ]
    }
},
...
```

The problem with these solutions is that AWS is always adding regions and 
new AZs within existing regions, requiring DevOps engineers to make changes 
to CloudFormation templates to take advantage of the new AZs or regions. 
SafeSelect is designed to eliminate the need for maintaining maps within 
existing CloudFormation templates.

## A Better Alternative to Maintaining Maps

Like Fn::Select, SafeSelect takes two parameters: 

1. index - The index of the object to retrieve. 
2. listOfObjects - The list of objects to select from. This list must not be null, nor can it have null entries.

SafeSelect uses a mod operation or integer remainder of index / the number of objects in the listOfObjects parameter. 
Like Fn::Select, item 0 returns the first item in the list, item 1 returns the second item in the list, etc. 
If you request the N<sup>th</sup> item in a list of N items, SafeSelect will return item 0 (the first item in the list).
If you request the (N+1)<sup>th</sup> item in a list of N items, SafeSelect will return item 1 (the second item in the list).
Because the developer of SafeSelect is a fan of Python, SafeSelect will return the last item if the index requested 
is set to -1. SafeSelect will return the second-to-last item if the index requested is set to -2.

Let's assume you wish to create 6 subnets spread out across all AZs within a region. Inside CloudFormation, you 
would code:

```
...
Resources:
  AZ0: 
    Type: Custom::SafeSelect
    Properties:
      ServiceToken: 
        Fn::ImportValue: 
          Fn::Sub: "${SafeSelectStackName}-SafeSelectFunction-Arn"         
      Index: 0
      ListOfObjects: 
        Fn::GetAZs: !Ref "AWS::Region"
  AZ1: 
    Type: Custom::SafeSelect
    Properties:
      ServiceToken: 
        Fn::ImportValue: 
          Fn::Sub: "${SafeSelectStackName}-SafeSelectFunction-Arn"         
      Index: 1
      ListOfObjects:
        Fn::GetAZs: !Ref "AWS::Region"
  AZ2: 
    Type: Custom::SafeSelect
    Properties:
      ServiceToken: 
        Fn::ImportValue: 
          Fn::Sub: "${SafeSelectStackName}-SafeSelectFunction-Arn"         
      Index: 2
      ListOfObjects: 
        Fn::GetAZs: !Ref "AWS::Region"
  AZ3: 
    Type: Custom::SafeSelect
    Properties:
      ServiceToken: 
        Fn::ImportValue: 
          Fn::Sub: "${SafeSelectStackName}-SafeSelectFunction-Arn"         
      Index: 3
      ListOfObjects: 
        Fn::GetAZs: !Ref "AWS::Region"
  AZ4: 
    Type: Custom::SafeSelect
    Properties:
      ServiceToken: 
        Fn::ImportValue: 
          Fn::Sub: "${SafeSelectStackName}-SafeSelectFunction-Arn"         
      Index: 4
      ListOfObjects: 
        Fn::GetAZs: !Ref "AWS::Region"
  AZ5: 
    Type: Custom::SafeSelect
    Properties:
      ServiceToken: 
        Fn::ImportValue: 
          Fn::Sub: "${SafeSelectStackName}-SafeSelectFunction-Arn"         
      Index: 5
      ListOfObjects: 
        Fn::GetAZs: !Ref "AWS::Region"
...
  Subnet01:
    Type: AWS::EC2::Subnet
    Properties:
      AvailabilityZone:
        !GetAtt
          - AZ0
          - Selected
      CidrBlock: "10.0.1.0/24"
      VpcId: !Ref VPCId
      Tags: 
        - Key: "Name"
          Value: !Join ["-", [ !Ref NamePrefixTag, "Subnet01" ] ]
  Subnet02:
    Type: AWS::EC2::Subnet
    Properties:
      AvailabilityZone:
        !GetAtt
          - AZ1
          - Selected
      CidrBlock: "10.0.2.0/24"
      VpcId: !Ref VPCId
      Tags: 
        - Key: "Name"
          Value: !Join ["-", [ !Ref NamePrefixTag, "Subnet02" ] ]
  Subnet03:
    Type: AWS::EC2::Subnet
    Properties:
      AvailabilityZone:
        !GetAtt
          - AZ2
          - Selected
      CidrBlock: "10.0.3.0/24"
      VpcId: !Ref VPCId
      Tags: 
        - Key: "Name"
          Value: !Join ["-", [ !Ref NamePrefixTag, "Subnet03" ] ]
  Subnet04:
    Type: AWS::EC2::Subnet
    Properties:
      AvailabilityZone:
        !GetAtt
          - AZ3
          - Selected
      CidrBlock: "10.0.4.0/24"
      VpcId: !Ref VPCId
      Tags: 
        - Key: "Name"
          Value: !Join ["-", [ !Ref NamePrefixTag, "Subnet04" ] ]
  Subnet05:
    Type: AWS::EC2::Subnet
    Properties:
      AvailabilityZone:
        !GetAtt
          - AZ4
          - Selected
      CidrBlock: "10.0.5.0/24"
      VpcId: !Ref VPCId
      Tags: 
        - Key: "Name"
          Value: !Join ["-", [ !Ref NamePrefixTag, "Subnet05" ] ]
  Subnet06:
    Type: AWS::EC2::Subnet
    Properties:
      AvailabilityZone:
        !GetAtt
          - AZ5
          - Selected
      CidrBlock: "10.0.6.0/24"
      VpcId: !Ref VPCId
      Tags: 
        - Key: "Name"
          Value: !Join ["-", [ !Ref NamePrefixTag, "Subnet06" ] ]
...
```

If the region has 5 AZs, 2 subnets would be created in 1 AZ and 1 subnet would be created in each of the other 4 AZs.
If the regioh has 3 AZs, 2 subnets would be created in each AZ.
If the region has 2 AZs, 3 subnets would be created in each AZ.

As a result, no maintenance is required as AWS adds AZs or regions.

## How to Download SafeSelect

Please visit my <a href="https://github.com/JoeTringali/SafeSelect" target="_blank">SafeSelect github repository</a> 
to get a copy of SafeSelect. A CloudFormation template for deploying SafeSelect 
and a sample CloudFormation template showing how to use SafeSelect are included. 
