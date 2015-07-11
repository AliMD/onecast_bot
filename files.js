import fs from 'fs';

export function write(file, data) {
  console.log(`write ${file}`);
  let
  filePath = `stores/${file}.json`,
  json = JSON.stringify(data, null, 2);
  console.log(json);
  return fs.writeFileSync(filePath, json);
}

export function read(file) {
  console.log(`Read ${file}`);
  let
  filePath = `stores/${file}.json`,
  fileContent = fs.readFileSync(filePath),
  data = JSON.parse(fileContent);
  console.log(fileContent);
  return data;
}
