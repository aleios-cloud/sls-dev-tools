import axios from "axios";

export const hello = async () => {
  const lambda2 = "https://seenl7tvr3.execute-api.eu-west-1.amazonaws.com/dev/hello";

  const resp = await axios.get(lambda2);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Heyo Ben Im lambda1',
      lambda2: resp.data.message,
    }),
  };
};
