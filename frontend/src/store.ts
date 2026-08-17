import api from './api';

const MS_PER_DAY = 86400000;
const IS_DEV = false //import.meta.env.DEV

var dev_emp_data: object[] = [
  { id: "1", name: "Nguyen Van A", position: "_", date_of_join: ""}, 
  { id: "2", name: "Nguyen Thi B", position: "_", date_of_join: ""}
]
var dev_item_data: any[] = []

export async function app_get(url: string) {
  if (IS_DEV)
  {
    if (url.includes("/employees/search"))
    {
      return dev_emp_data
    }
    else if (url.includes("/items"))
    {
      return dev_item_data
    }
    return dev_item_data
  }

  const fetchPromise = api.get(url)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      const status = err.response?.status;    
      const message = err.response?.data?.detail 
      throw new Error(`Failed to load decks: ${status} ${message}`);
    });
  return fetchPromise;
}

export async function app_post(url: string, body: object) {
  if (IS_DEV)
  {
    if (url.includes("/employees"))
    {
      dev_emp_data.push(body)
    }
    else if (url.includes("/items"))
    {
      dev_item_data.push(body)
    }

    console.log(dev_emp_data)
    console.log(dev_item_data)
    return
  }

  return api.post(url, body);
}

export async function app_patch(url: string, body: object) {
  return api.patch(url, body);
}

export function isPlainObject(value: any) {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

