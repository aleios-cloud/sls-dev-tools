export const hello = async () => ({
  statusCode: 200,
  body: JSON.stringify({
    message: 'Helllo ello im lambda 2',
  }),
});
