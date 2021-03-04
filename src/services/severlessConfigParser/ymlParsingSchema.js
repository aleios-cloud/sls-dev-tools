const yaml = require("js-yaml");

class CustomTag {
  constructor(type, data) {
    this.type = type;
    this.data = data;
  }
}

const tags = ["scalar", "sequence", "mapping"].map(
  (kind) =>
    // first argument here is a prefix, so this type will handle anything starting with !
    new yaml.Type("!", {
      kind,
      multi: true,
      representName(object) {
        return object.type;
      },
      represent(object) {
        return object.data;
      },
      instanceOf: CustomTag,
      construct(data, type) {
        return new CustomTag(type, data);
      },
    })
);

const YAML_SCHEMA = yaml.DEFAULT_SCHEMA.extend(tags);

export default YAML_SCHEMA;
