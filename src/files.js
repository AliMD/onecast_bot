import fs from 'fs';

export function write(file, data, store = './stores') {
  let filePath = `${store}/${file}.json`;
  console.log(`write ${filePath}`);
  let json = JSON.stringify(data, null, 2);
  console.log(`${json.length} characters`);
  // console.log(json);
  return fs.writeFileSync(filePath, json);
}

export function read(file, defaultData, store = './stores') {
  let filePath = `${store}/${file}.json`;
  console.log(`Read ${filePath}`);
  if(!fs.existsSync(filePath))
  {
    write(file, defaultData, store);
    return defaultData;
  }
  let
  fileContent = fs.readFileSync(filePath),
  data = JSON.parse(fileContent)
  ;
  console.log(`${fileContent.length} characters`);
  // console.log(data);
  return data;
}
