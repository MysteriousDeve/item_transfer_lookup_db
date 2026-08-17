import { app_get, app_patch, app_post } from '../../store';
import { useState, useEffect } from 'react';
import { Box, Button, Group, TextInput, Text, Title, Stack, Table, Paper } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import DataTable from '../../components/DataTable';

export default function EmployeeManagement() {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {"name": "", "date_of_join": new Date().toISOString().split('T')[0]},
    onSubmitPreventDefault: "always",
    validate: {
      name: (input) => !input ? "Employee name is empty" : null,
      date_of_join: (input) => !input ? "Date is invalid" : null
    }
  })

  // Handle loading employee list
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);

  // Function that handle fetching employees
  function fetchStuff2() {
    setLoading(true)
    setError(null)
    app_get(`/employees`)
      .then((stuff) => setData(stuff))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }
  useEffect(() => {fetchStuff2()}, [])



  // Message for add/edit employee operations
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(true);

  // Add/edit employee mode
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function editSetDefault() {
    if (editingIndex !== null) {
      setMsg("");
      form.setValues({ 
        name: data[editingIndex].name,
        date_of_join: data[editingIndex].date_of_join
      })
    }
    else {
      form.reset();
    }
  }

  useEffect(editSetDefault, [editingIndex])


  // JSX for editing interface
  const addEdit = (
    <div>
      <form onSubmit={form.onSubmit(
        (e: any) => {
          setMsg("");
          const request = editingIndex !== null 
            ? app_patch(`/employees/get/${data[editingIndex].id}/edit`, e) 
            : app_post("/employees/add", e) 

          request.then((res) => {
              setMsg("Success");
              setIsSuccess(true);
              fetchStuff2();
              setEditingIndex(null);
              form.reset();
            })
            .catch((err) => {
              setMsg(`${err}`);
              setIsSuccess(false);
            });
          }
        )}>


        {/*
          * Title
          */}
        <Title order={1}>{
          editingIndex !== null 
          ? `Editing employee ${ data[editingIndex].name }` 
          : "Add employees"
        }</Title>

        <div style={{padding: '1rem'}} />


        {/*
          * Fields for add/edit form
          */}
        <Stack>
          <TextInput 
            label="Name"
            placeholder="Name"
            key={form.key('name')}
            {...form.getInputProps('name')}
          />

          <DateInput 
            label="Date of join"
            placeholder="Date of join"
            key={form.key('date_of_join')}
            {...form.getInputProps('date_of_join')}
          />
          <Group align='baseline'>
            { editingIndex !== null &&
              <>
                <Button variant="outline" mt="sm" onClick={editSetDefault}>
                  Revert
                </Button>
                <Button variant="outline" mt="sm" onClick={() => {setEditingIndex(null); setMsg("");}}>
                  Cancel
                </Button>
              </>
            }
            <p style={{ color: (isSuccess ? "green" : "red"), marginLeft: 'auto' }}>{msg}</p>
            <Button type="submit" mt="sm" onClick={() => {setMsg("");}}>
              { editingIndex !== null ? `Update` : "Add" }
            </Button>
          </Group>
        </Stack>
      </form>
    </div>
  )

  // Table that show employee details
  const list = (
    <Stack>
      <Title order={1}>Employee List</Title>
      <Text>Select an employee to edit. Employee count: <span style={{ color: 'lightblue' }}>{data.length}</span></Text>
      <Paper>
        <DataTable 
          data={data} 
          withEdit={true} 
          onEdit={(_, index) => {setEditingIndex(index)}}
          labeler={{
            id: 'ID',
            name: 'Name',
            date_of_join: 'Date of Join'
          }}
        />
      </Paper>
    </Stack>
  )

  return (
    <Group align='baseline' gap={32}>
      <Box flex='1'>{list}</Box>
      <Box flex='1'>{addEdit}</Box>
    </Group>
  )
}
