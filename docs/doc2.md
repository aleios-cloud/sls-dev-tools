---	
id: doc2	
title: Cloudwatch Pricing	
---	

# A note on AWS API calls and pricing	

This tool does make use of the AWS API to get metrics. Authentication is handled implicitly via the AWS NodeJS SDK. Pricing around Cloudwatch is designed for scale, but be warned that this tool is making calls to AWS.	

Full details on AWS API pricing can be found here:	
- https://aws.amazon.com/cloudwatch/pricing/	

For instance, the cost of GetMetricData as of 25/08/19 was $0.01 per 1,000 metrics requested.	
- This tool take no liability in pricing data provided and please use AWS's docs to ensure pricing is appropriate for you.	

The current list of calls made by the tool:	

- CloudFormation: listStackResources	
- CloudWatch: getMetricData	
- CloudWatchLogs: describeLogStreams, filterLogEvents	
- More may be added, check code for full list