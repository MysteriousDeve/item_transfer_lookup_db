import { Button, getRefProp, Paper, Table } from '@mantine/core';
import { PencilSimpleIcon } from '@phosphor-icons/react';
import { useState, useEffect } from 'react';

// We assume that the data passed is array of hashmaps
export default function DataTable({ 
  data, withEdit, onEdit, labeler, hideColumn, processData
} : { 
  data: any[], 
  withEdit?: any, 
  onEdit?: (entry: any, index: number) => unknown, 
  labeler?: Record<string, string>,
  hideColumn?: string[],
  processData?: Record<string, CallableFunction>
}) {
  if (!Array.isArray(data) || data.length == 0 || Object.keys(data[0]).length == 0)
  {
    return (<Table></Table>)
  }

  const first_row = data[0]
  const keys = Object.keys(first_row).filter((v)=>{ return !hideColumn?.includes(v) })
  const processes = processData ? Object.keys(processData) : [];

  return (
    <Table style={{height: '600px', display: 'block', overflowY: 'scroll'}}>
      <Table.Thead style={{position: 'sticky', top: 0, background: 'var(--mantine-color-dark-7)'}}>
        <Table.Tr>
          {withEdit && <Table.Th w={32} />}
          {
            keys.map((k) => (
              <Table.Th key={k}>{labeler && labeler[k] ? labeler[k] : k}</Table.Th>
            ))
          } 
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {
          data.map((entry, index) => (
            <Table.Tr>
              {
                withEdit &&
                <Table.Td style={{padding: 0, marginRight: 'auto'}}>
                  <Button size='30' style={{ margin: 4, padding: 6 }} onClick={() => {onEdit?.(entry, index)}}>
                    <PencilSimpleIcon size={20} />
                  </Button>
                </Table.Td>
              }
              {keys.map((k) => (
                <Table.Td style={{whiteSpace: 'pre-wrap'}} key={k}>
                  { processData && processes.includes(k) ? processData[k](entry[k]) : entry[k] }
                </Table.Td>
              ))}
            </Table.Tr>
          ))
        }
      </Table.Tbody>
    </Table>
  );
}
