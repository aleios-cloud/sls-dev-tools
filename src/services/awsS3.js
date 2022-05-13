async function getAllS3Buckets(S3) {
  const response = await S3.listBuckets({}).promise();
  const allBuckets = response.Buckets;
  return allBuckets;
}

module.exports = {
  getAllS3Buckets,
};
