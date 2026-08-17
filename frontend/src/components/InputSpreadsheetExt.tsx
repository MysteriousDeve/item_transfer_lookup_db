import { useState, useEffect, useRef, cloneElement } from 'react';
import { app_get } from '../store'
import { Input, NumberInput, Table, TextInput, Text, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';

// Spreadsheet that can only grow vertically (by adding more rows)
// Support for extra functionality
// schema: array of column type and descriptions
// value (optional probably): make the spreadsheet manage the external state instead
// TODO integrate this functionality

type Rec = Record<string, any>

export function InputSpreadsheetExt({ 
  schema, onEdit, settings, value, views 
} : {
  schema: Rec[], onEdit?: any, settings: Record<string, any>, value: Record<string, any>, views: string[] 
}) {
  const readOnly = settings.readOnly ?? false;
  const customKey = settings.customKey ?? "";
  const id = settings.id ?? "";

  const [data, setData] = useState<Rec | null>(null);
  const [edited, setEdited] = useState(false);

  const setItem = (rowId: string, prop: string, val: any) => {
    if (readOnly || schema.filter((s: Rec) => s.name == prop)[0].readOnly) {
      return;
    }
    setData(prevList => {
      const newMap: any = {...prevList};
      newMap[rowId][prop] = val;
      return newMap;
    });
  }

  useEffect(() => {
    if (value) setData(value);
  }, [value]);

  useEffect(() => {
    if (edited) {
      onEdit?.(data);
    }
    setEdited(false);
  }, [data])


  // Generate cell elements
  // s: schema for the column
  // k: row key
  function GetColumnCellElement(s: Rec, k: string) {
    var elem = null;

    if (s.type === "custom") {  
      elem = cloneElement((s.custom)(k), {
      IField_onChange: (val: any) => { setItem(k, s.name, val); }})
    }
    else {
      // Handle saving state on input change
      const OnChange: any = (val: any) => {
        if (s.type === "number") {
          setItem(k, s.name, val.toString());
          return;
        }
        setItem(k, s.name, val);
      }

      const selfReadOnly = (s.readOnly !== undefined ? s.readOnly : false) || readOnly;

      if (data === null) {
        throw Error("The data is nulll");
      }

      if (s.type == "text") {
        if (!selfReadOnly)
        elem = <Textarea 
          rows={2}
          value={data[k][s.name] ?? ""} 
          readOnly={selfReadOnly} 
          onChange={(e) => OnChange(e.currentTarget.value)} 
        />
        else elem = <Text>{data[k][s.name] ?? ""}</Text>
      }
      else if (s.type == "number") {

        if (!selfReadOnly) {
          const maxVal = s.maxFrom !== undefined ? data[k][s.maxFrom] as number : Number.MAX_VALUE
          elem = <NumberInput value={data[k][s.name] ?? ""} readOnly={selfReadOnly} onChange={OnChange} 
                  max={maxVal} min={1}></NumberInput>
        }

        else elem = <Text>{data[k][s.name] ?? ""}</Text>
      }
      else {
        elem = <Input type={s.type} value={data[k][s.name] ?? ""} readOnly={selfReadOnly} onChange={OnChange}/>
      }
    }
    // Wrap element in td and return
    return <Table.Td key={s.name + k}><div className='cell-wrapper'>{elem}</div></Table.Td>
  }

  function GetColumnCellHeader(s: Rec) {
    var fixedWidth = s.width;
    var displayText = s.displayName ?? s.name;
    if (s.type === "delete") {
      displayText = "";
      if (!fixedWidth) {
        fixedWidth = "200px";
      }
    }
    if (fixedWidth) {
      return <Table.Th style={{width: fixedWidth}} key={s.name}>{displayText}</Table.Th>
    }
    return <Table.Th key={s.name}>{displayText}</Table.Th>
  }

  // Implement view-mapping
  return (
    <div style={{width: '100%'}}>
      <Table>
        <Table.Thead><Table.Tr>
        {
          schema.map(GetColumnCellHeader)
        }
        <Table.Th style={{margin: 0, padding: 0, opacity: 1}}></Table.Th>
        </Table.Tr></Table.Thead>

        <Table.Tbody>
        {
          (views && data !== null ? views.map((val) => {return [val, data[val]]}) : Object.entries(data ?? {}))
          .map(([k, rowData]) => (
            <Table.Tr key={k}>
              {schema.map((s) => GetColumnCellElement(s, k))}
              <Table.Td key={k + "_rower_"} style={{margin: 0, padding: 0, opacity: 0, maxWidth: 1}}>
                <div className='cell-wrapper'><Textarea rows={3} /></div>
              </Table.Td>
            </Table.Tr>
          ))
        }
        </Table.Tbody>
      </Table>
    </div>
  );
}
