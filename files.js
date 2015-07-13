import fs from 'fs';

export function write(file, data, store = './stores') {
  console.log(`write ${file}`);

  let
  filePath = `${store}/${file}.json`,
  json = JSON.stringify(data, null, 2);
  console.log(`${data.length} item`);
  // console.log(json);
  return fs.writeFileSync(filePath, json);
}

export function read(file, defaultData, store = './stores') {
  console.log(`Read ${file}`);

  let filePath = `${store}/${file}.json`;
  if(!fs.existsSync(filePath))
  {
    write(file, defaultData);
    return defaultData;
  }
  let
  fileContent = fs.readFileSync(filePath),
  data = JSON.parse(fileContent)
  ;
  console.log(`${data.length} item`);
  // console.log(data);
  return data;
}
