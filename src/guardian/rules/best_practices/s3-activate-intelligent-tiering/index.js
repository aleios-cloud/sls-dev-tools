class S3ActivateIntelligentTiering {
  constructor(AWS, stackName, stackFunctions, SLS, stackS3Buckets) {
    this.AWS = AWS;
    this.stackName = stackName;
    this.stackFunctions = stackFunctions;
    this.SLS = SLS;
    this.stackS3Buckets = stackS3Buckets;
    this.name = "s3-activate-intelligent-tiering";
    this.failureMessage =
      "The following S3 buckets have no Intelligent Tiering configurations defined";
    this.S3 = new this.AWS.S3();
    this.failingResources = [];
  }

  async getNumberOfIntelligentTieringConfigurations(bucketName) {
    const configurations = await this.S3.listBucketIntelligentTieringConfigurations(
      {
        Bucket: bucketName,
      }
    ).promise();
    return configurations.IntelligentTieringConfigurationList.length;
  }

  async run() {
    try {
      const bucketsWithCount = await Promise.all(
        this.stackS3Buckets.map(async (bucket) => {
          const numberOfConfigurations = await this.getNumberOfIntelligentTieringConfigurations(
            bucket.Name
          );
          return {
            bucketName: bucket.Name,
            numberOfConfigurations,
          };
        })
      );
      this.failingResources = bucketsWithCount.reduce(
        (acc, current) =>
          current.numberOfConfigurations === 0 ? [...acc, current] : acc,
        []
      );
      this.result = this.failingResources.length === 0;
    } catch (e) {
      console.error(e);
      this.result = false;
    }
    return this.result;
  }
}

export default S3ActivateIntelligentTiering;
