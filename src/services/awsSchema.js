function getSchema(api, registry, schema) {
  return api
    .describeSchema({ RegistryName: registry, SchemaName: schema })
    .promise()
    .catch((error) => console.error(error));
}

function handleAWSEvent(schemas) {
  // Update detailType and source fields from schema
  const detailType = schemas.AWSEvent["x-amazon-events-detail-type"];
  const source = schemas.AWSEvent["x-amazon-events-source"];

  // "detail" is contained in the AWSEvent schema as a reference,
  // typically of the form #/components/schemas/[EventName]
  const reference = schemas.AWSEvent.properties.detail.$ref;
  const schemaName = reference.substring(reference.lastIndexOf("/") + 1);
  const eventSchema = schemas[schemaName];

  if (Object.prototype.hasOwnProperty.call(eventSchema, "properties")) {
    return {
      type: detailType,
      source,
      properties: eventSchema.properties,
    };
  }
  return {};
}

function handleCustomEvent(schemas) {
  if (Object.prototype.hasOwnProperty.call(schemas.Event, "properties")) {
    return { properties: schemas.Event.properties };
  }
  return {};
}

async function getProperties(api, registry, schema) {
  const data = await getSchema(api, registry, schema);
  const parsedEvent = JSON.parse(data.Content);
  const parsedSchemas = parsedEvent.components.schemas;

  if (Object.prototype.hasOwnProperty.call(parsedSchemas, "AWSEvent")) {
    return handleAWSEvent(parsedSchemas);
  }
  return handleCustomEvent(parsedSchemas);
}

module.exports = {
  getSchema,
  handleAWSEvent,
  handleCustomEvent,
  getProperties,
};
