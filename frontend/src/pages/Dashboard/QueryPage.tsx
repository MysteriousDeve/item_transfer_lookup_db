import { useEffect, useState, useCallback } from "react";
import { app_get } from "../../store";
import { AutocompleteInput } from "../../components/AutocompleteInput";
import LoadingWaiter from "../../components/LoadingWaiter";
import DataTable from "../../components/DataTable";
import { Paper, Text } from "@mantine/core";
import { formatDate } from "../../utils";

const ITEM_COLUMN_LABELS = {
  id: "ID",
  name: "Name",
  quantity: "Quantity",
  state: "State",
  date_of_transfer: "Date of Transfer",
  transfer_from: "Transfer from",
  qty_remaining: "Qty remaining",
  return_logs: "Return Logs",
};

/**
 * Fetches an employee's items whenever `empId` changes.
 * Encapsulates the loading/error/data state trio so the page component
 * doesn't have to juggle them directly.
 */
function useEmployeeItems(empId: string | null) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (empId === null) {
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);

    app_get(`/employees/get/${empId}/items`)
      .then((value) => {
        
        // Insert some code here to reformat the date_of_transfer
        value = (value as any[]).map((elem) => { 
          elem.date_of_transfer = formatDate(elem.date_of_transfer);
          return elem;
        })

        setData(value);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [empId]);

  return { data, loading, error };
}

export default function QueryPage() {
  const [empId, setEmpId] = useState<string | null>(null);
  const { data, loading, error } = useEmployeeItems(empId);

  const handleEmployeeChange = useCallback((item: Record<string, any> | null) => {
    setEmpId(item?.id ?? null);
  }, []);

  return (
    <div style={{ display: "flex", gap: "1rem", minHeight: "100%", flexDirection: "column" }}>
      <div>
        <h1>Transfer lookup</h1>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <label htmlFor="emp-name">Name: </label>
          <AutocompleteInput
            fetchUrl="/employees/search"
            labeler={(item: Record<string, any>) => item.name}
            onChangeEx={handleEmployeeChange}
          />
        </div>
      </div>

      <Paper style={{ width: "100%", overflowY: "auto", minHeight: "100%" }}>
        <LoadingWaiter loading={loading} error={error}>
          {empId === null ? (
            <Text>Select an employee to get started.</Text>
          ) : data.length === 0 ? (
            <Text><i>Selected employee has no entries.</i></Text>
          ) : null}

          <DataTable data={data} labeler={ITEM_COLUMN_LABELS} hideColumn={["transfer_from_id"]}
          processData={{
            return_logs : (data: {date: string, quantity: number, state: string}[]) => {
              const processed = data.map((d) => `${formatDate(d.date)}: quantity: ${d.quantity}, state: ${d.state}`).join("\n");
              return processed;
            },
            qty_remaining: (qty: number) => {
              return <div style={{ color: qty > 0 ? 'hsl(0, 100%, 83%)' : 'grey' }}>{qty}</div>
            }
          }}
          />
        </LoadingWaiter>
      </Paper>
    </div>
  );
}