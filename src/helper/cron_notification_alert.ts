import cron from "node-cron";
import { withClient } from '../util/database';
import nodemailer from "nodemailer";
import { ulid } from "ulid";
import { columnConfig } from "../helper/columnConfig ";
import PDFDocument from 'pdfkit';


const operatorMap: Record<string, string> = {
  "equal to": "=",
  "not equal to": "<>",
  "greater than": ">",
  "less than": "<",
  "greater than or equal to": ">=",
  "less than or equal to": "<="
};

// your transactionTablesMap here
const transactionTablesMap: Record<string, string[]> = {
  "Own Emission": [
    "users_table"
  ],
  "Product": [
    "product_category",
    "product_sub_category",
    "life_cycle_stage",
    "users_table"
  ],
  "Bom Pcf Request": [
    "product_category",
    "product_sub_category",
    "component_category",
    "component_type",
    "manufacturer",
    "users_table"
  ],
  "Bom Pcf Request Product Specification": [
    "bom_pcf_request",
    "users_table"
  ],
  "Bom": [
    "bom_pcf_request",
    "users_table"
  ],
  "Task Managment": [
    "category",
    "bom_pcf_request",
    "users_table"
  ],
  "PCF Bom Comments": [
    "bom_pcf_request",
    "users_table"
  ]

};



async function sendEmail(to: string[], subject: string, html: string, attachments: any[] = []) {
  return withClient(async (client: any) => {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtppro.zoho.in',
        port: 587,
        secure: false,
        auth: {
          user: 'support@enviguide.info',
          pass: 'Maaran@7890',
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      await transporter.sendMail({
        from: "support@enviguide.info",
        to,
        subject,
        // html,
        // attachments // ✅ Attach PDF if exists
      });

    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email");
    }
  });
}

async function generateInvoicePDF(rows: any[], requiredColumns: string[]): Promise<Buffer> {

  return new Promise((resolve, reject) => {
    return withClient(async (client: any) => {
      try {
        const doc = new PDFDocument();
        const buffers: Uint8Array[] = [];

        doc.on('data', (chunk: Uint8Array) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Title
        doc.fontSize(18).text('Envigude Data', { align: 'center' });
        doc.moveDown();

        rows.forEach((row, index) => {
          doc.fontSize(14).text(`Invoice ${index + 1}`, { underline: true });
          doc.moveDown(0.5);

          requiredColumns.forEach(col => {
            if (row[col] !== undefined) {
              let label = formatLabel(col);
              doc.fontSize(12).text(`${label}: ${row[col]}`);
            }
          });

          doc.moveDown();
        });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  });
}

async function generateInvoiceSqlPDF(
  rows: any[],
  requiredColumns: string[],
  tables: string[]
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    return withClient(async (client: any) => {
      try {
        function getLabelForColumn(column: string, tables: string[]): string {
          if (column.endsWith("_data")) {
            return "Enviguide Data";
          }

          for (const table of tables) {
            if (columnConfig[table]) {
              const colObj = columnConfig[table].find(c => c.value === column);
              if (colObj) return colObj.label;
            }
          }

          return column
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
        }

        const doc = new PDFDocument();
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Title
        doc.fontSize(18).text('Envigude Data', { align: 'center' });
        doc.moveDown();

        rows.forEach((row, index) => {
          doc.fontSize(14).text(`Invoice ${index + 1}`, { underline: true });
          doc.moveDown(0.5);

          requiredColumns.forEach(col => {
            if (row[col] !== undefined) {
              const label = getLabelForColumn(col, tables);
              doc.fontSize(12).text(`${label}: ${row[col]}`);
            }
          });

          doc.moveDown();
        });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  });
}

// ✅ Label Formatter
function formatLabel(col: string): string {
  if (col.endsWith("_data")) {
    return "Enviguide Data";  // Force this label
  }
  return col
    .replace(/_/g, ' ')           // Replace underscores with spaces
    .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize words
}



export async function scheduleNotifications() {
  return withClient(async (client: any) => {
    try {

      const query = `
      SELECT *
      FROM notification
      WHERE condition_type = 'Simple Condition'
        AND is_email = true
        AND start_or_stop = true
        AND (sql_query = '' OR sql_query IS NULL)
    `;

      const result = await client.query(query);
      const notifications = result.rows;

      notifications.forEach((notif: any) => {
        const {
          ntf_id,
          table_names,
          transaction_type,
          column_condition,
          frequency,
          frequency_accurrence,
          frequency_time_gap,
          frequency_first_alert,
          created_date
        } = notif;

        const tables = table_names?.split(",").map((t: string) => t.trim()) || [];
        if (tables.length === 0) return console.warn(`No tables provided for ntf_id=${ntf_id}`);

        const mainTableMap: Record<string, { main: string; joinKey: string }> = {
          "Visitor": { main: "visitor", joinKey: "visitor_id" },
          "Govt ids": { main: "govt_id_type", joinKey: "govt_id_type_id" },
        };

        const joinInfo = mainTableMap[transaction_type];
        if (!joinInfo) return console.warn(`No join rules found for transaction_type: ${transaction_type}`);

        const { main: mainTable, joinKey } = joinInfo;

        const parsedConditions = parseConditions(column_condition);
        if (parsedConditions.length === 0) return console.log("No valid conditions");

        // const requiredColumns = parsedConditions.map((c) => c.col);
        let requiredColumns = parsedConditions.map(c => c.col);

        // ✅ Add Enviguide Data column dynamically
        const invoiceCol = joinKey.replace(/_id$/, "_data");
        if (!requiredColumns.includes(invoiceCol)) {
          requiredColumns.unshift(invoiceCol);
        }

        const tableColumns: Record<string, string[]> = {};
        Promise.all(
          tables.map(async (tbl: string) => {
            const colRes = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = $1`, [tbl]);
            tableColumns[tbl] = colRes.rows.map((r: any) => r.column_name);
          })
        ).then(async () => {
          const conditionParts: string[] = [];
          for (const cond of parsedConditions) {
            const sourceTable = tables.find((tbl: string) => tableColumns[tbl].includes(cond.col));
            if (!sourceTable) {
              continue;
            }

            let expr = "";
            if (cond.isDateKeyword) {
              expr = buildDateCondition(`${sourceTable}.${cond.col}`, cond.value);
            } else {
              expr = isNaN(Number(cond.value))
                ? `${sourceTable}.${cond.col} ${cond.sqlOp} '${cond.value}'`
                : `${sourceTable}.${cond.col} ${cond.sqlOp} ${cond.value}`;
            }

            if (conditionParts.length > 0 && cond.connector) {
              conditionParts.push(cond.connector);
            }
            conditionParts.push(expr);
          }

          const whereClause = conditionParts.join(" ");
          const joinTables = tables.filter((t: string) => t !== mainTable);
          const joinClauses = joinTables.map((tbl: string) => `LEFT JOIN ${tbl} ON ${tbl}.${joinKey} = ${mainTable}.${joinKey}`);

          const cronExprs = buildCronExpressions(frequency, frequency_first_alert, frequency_accurrence, frequency_time_gap);

          cronExprs.forEach(cronExpr => {
            cron.schedule(cronExpr, async () => {
              try {

                // ✅ Check history & limit
                const histQuery = `
                SELECT created_date
                FROM notification_triggered_history
                WHERE ntf_id = $1
                AND ${getDateCondition(frequency, created_date)}
                ORDER BY created_date DESC
              `;

                const histRes = await client.query(histQuery, [ntf_id]);

                // ✅ Stop after limit
                if (histRes.rows.length >= parseInt(frequency_accurrence)) {
                  return;
                }

                // ✅ Check gap
                if (histRes.rows.length > 0) {

                  const lastTriggered = new Date(histRes.rows[0].created_date);
                  const now = new Date();
                  const gapMinutes = parseInt(frequency_time_gap) * 60;
                  const diffMinutes = Math.abs((now.getTime() - lastTriggered.getTime()) / (1000 * 60));

                  if (diffMinutes < gapMinutes) {
                    return;
                  }
                }

                const commRes = await client.query(
                  `SELECT * FROM notification_communication_channel WHERE ntf_id = $1 AND is_email = true`,
                  [ntf_id]
                );
                if (!commRes.rows.length) return console.log("No email template");
                const { subject, body } = commRes.rows[0];

                const recRes = await client.query(`SELECT * FROM notification_recipient WHERE ntf_id = $1 AND is_email = true`, [ntf_id]);
                if (!recRes.rows.length) return console.log("No recipients");

                // const emailsToSend: string[] = [];
                // for (const r of recRes.rows) {
                //   if (r.specific_users?.length) emailsToSend.push(...r.specific_users);
                //   else if (r.recipient_users?.length) {
                //     const uRes = await client.query(`SELECT user_email FROM users_table WHERE user_id = ANY($1)`, [r.recipient_users]);
                //     emailsToSend.push(...uRes.rows.map((u) => u.user_email));
                //   }
                // }

                const emailsToSend: string[] = [];

                for (const r of recRes.rows) {

                  // ✅ Process specific_users if they contain valid emails
                  if (Array.isArray(r.specific_users)) {
                    const validSpecificUsers = (r.specific_users as string[]).filter(u => u && u.trim() !== "");
                    if (validSpecificUsers.length > 0) {
                      emailsToSend.push(...validSpecificUsers);
                    }
                  }

                  // ✅ Process recipient_users if they contain valid IDs
                  if (Array.isArray(r.recipient_users) && r.recipient_users.length > 0) {
                    const uRes = await client.query(
                      `SELECT user_email FROM users_table WHERE user_id = ANY($1::text[]) AND user_email IS NOT NULL AND user_email <> ''`,
                      [r.recipient_users]
                    );

                    const fetchedEmails = uRes.rows.map((u: any) => u.user_email).filter((email: any) => email && email.trim() !== "");

                    if (fetchedEmails.length > 0) {
                      emailsToSend.push(...fetchedEmails);
                    }
                  }
                }

                if (!emailsToSend.length) return console.log("No resolved email addresses");

                const finalSQL = `SELECT * FROM ${mainTable} ${joinClauses.join(" ")} WHERE ${whereClause}`;
                const result = await client.query(finalSQL);

                const rows = result.rows;
                if (!rows.length) return console.log(`No matching data for ntf_id=${ntf_id}`);

                // const detailsHtml = buildEmailHtmlFromRows(rows, requiredColumns);
                // const finalHtml = `<p>${body}</p><p><strong>Details:</strong></p>${detailsHtml}`;
                // await sendEmail(emailsToSend, subject, finalHtml);
                // console.log(`Email sent for ntf_id=${ntf_id}`);

                let finalHtml = `<p>${body}</p>`;
                let attachmentsArray: any[] = [];

                if (commRes.rows[0].attachments && commRes.rows[0].attachments.includes("Envigude Data")) {

                  const pdfBuffer = await generateInvoicePDF(rows, requiredColumns);
                  attachmentsArray.push({
                    filename: 'enviguide-data.pdf',
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                  });

                  finalHtml += `<p><strong>Envigude Data has been attached as a PDF file.</strong></p>`;
                } else {
                  const detailsHtml = buildEmailHtmlFromRows(rows, requiredColumns, tables);
                  finalHtml += `<p><strong>Details:</strong></p>${detailsHtml}`;
                }
                await sendEmail(emailsToSend, subject, finalHtml, attachmentsArray);

                const nth_id = ulid();
                await client.query(`INSERT INTO notification_triggered_history (nth_id, ntf_id, status) VALUES ($1, $2, $3)`, [
                  nth_id,
                  ntf_id,
                  "Success"
                ]);
              } catch (err) {
                console.error(`Error processing ntf_id=${ntf_id}:`, err);
              }
            });

          });
        });
      });
    } catch (error) {
      console.error("Error scheduling notifications:", error);
    }


    // ✅ Parse conditions (supports date keywords)
    function parseConditions(condStr: string) {
      const operatorMap: Record<string, string> = {
        "equal to": "=",
        "greater than": ">",
        "less than": "<",
        "not equal to": "!=",
        "greater than or equal to": ">=",
        "less than or equal to": "<=",
        "like": "ILIKE"
      };

      const dateKeywords = ["today", "yesterday", "this week", "this month", "this quarter", "this year"];

      const tokens = condStr.split(/\s+(AND|OR)\s+/i);
      const result: { col: string; sqlOp: string; value: string; connector?: string; isDateKeyword?: boolean }[] = [];

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i].trim();
        if (!token) continue;

        if (token.toUpperCase() === "AND" || token.toUpperCase() === "OR") continue;

        const connector = i > 0 && tokens[i - 1].match(/AND|OR/i) ? tokens[i - 1].toUpperCase() : undefined;

        for (const [key, sqlOp] of Object.entries(operatorMap)) {
          const opRegex = new RegExp(`\\s${key}\\s`, "i");
          if (opRegex.test(token)) {
            const [col, val] = token.split(opRegex);
            const trimmedVal = val.trim();
            const isDateKeyword = dateKeywords.includes(trimmedVal.toLowerCase());
            result.push({
              col: col.trim(),
              sqlOp,
              value: trimmedVal,
              connector,
              isDateKeyword
            });
            break;
          }
        }
      }

      return result;
    }

    // ✅ Date keyword conversion
    function buildDateCondition(column: string, keyword: string): string {
      switch (keyword.toLowerCase()) {
        case "today":
          return `DATE(${column}) = CURRENT_DATE`;
        case "yesterday":
          return `DATE(${column}) = CURRENT_DATE - INTERVAL '1 day'`;
        case "this week":
          return `DATE(${column}) >= date_trunc('week', CURRENT_DATE)`;
        case "this month":
          return `DATE(${column}) >= date_trunc('month', CURRENT_DATE)`;
        case "this quarter":
          return `DATE(${column}) >= date_trunc('quarter', CURRENT_DATE)`;
        case "this year":
          return `DATE(${column}) >= date_trunc('year', CURRENT_DATE)`;
        default:
          return `DATE(${column}) = CURRENT_DATE`;
      }
    }

    // function buildEmailHtmlFromRows(rows: any[], columns: string[]): string {
    //   let html = "<ul>";
    //   for (const row of rows) {
    //     html += "<li>";
    //     const idColumn = Object.keys(row).find((k) => k.endsWith("_data")) || "invoice_number";
    //     html += `<strong>${idColumn}:</strong> ${row[idColumn]}<br/>`;
    //     columns.forEach((col) => {
    //       if (row[col] !== undefined) html += `<strong>${col}:</strong> ${row[col]}<br/>`;
    //     });
    //     html += "</li><br/>";
    //   }
    //   html += "</ul>";
    //   return html;
    // }
    function buildEmailHtmlFromRows(rows: any[], columns: string[], tables: string[]): string {
      let html = '<ul>';

      for (const row of rows) {
        html += '<li>';

        columns.forEach(col => {
          if (row[col] !== undefined) {
            const label = getLabelForColumn(col, tables);
            html += `<strong>${label}:</strong> ${row[col]}<br/>`;
          }
        });

        html += '</li><br/>';
      }

      html += '</ul>';
      return html;
    }

    function buildCronExpressions(frequency: string, firstAlert: string, accurrence: string, timeGap: string): string[] {
      const [hour, minute] = firstAlert.split(":").map(Number);
      const occurrences = parseInt(accurrence) || 1;
      const gap = parseInt(timeGap) || 0;
      const expressions: string[] = [];

      for (let i = 0; i < occurrences; i++) {
        let newHour = hour + (i * gap);
        if (newHour >= 24) newHour = newHour % 24;

        if (frequency === "Daily") expressions.push(`${minute} ${newHour} * * *`);
        else if (frequency === "Weekly") expressions.push(`${minute} ${newHour} * * 1`);
        else if (frequency === "Monthly") expressions.push(`${minute} ${newHour} 1 * *`);
      }
      return expressions;
    }

    function getDateCondition(frequency: string, created_date: string): string {
      if (frequency === "Daily") return "DATE(created_date) = CURRENT_DATE";
      if (frequency === "Weekly") return `created_date >= date_trunc('week', CURRENT_DATE) AND created_date >= '${created_date}'`;
      if (frequency === "Monthly") return `created_date >= date_trunc('month', CURRENT_DATE) AND created_date >= '${created_date}'`;
      return "1=1";
    }

    // Helper to get label name for a column
    function getLabelForColumn(column: string, tables: string[]): string {
      // Force "Enviguide Data" if column ends with _data
      if (column.endsWith("_data")) {
        return "Enviguide Data";
      }

      // Check if label exists in columnConfig
      for (const table of tables) {
        if (columnConfig[table]) {
          const colObj = columnConfig[table].find(c => c.value === column);
          if (colObj) return colObj.label;
        }
      }

      // Fallback: Format column name (replace _ with space and capitalize)
      return column
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    }
  });
}

export async function scheduleNotificationsToWhatsapp() {
  return withClient(async (client: any) => {
    try {

      const query = `
      SELECT *
      FROM notification
      WHERE condition_type = 'Simple Condition'
        AND is_whatsapp = true
        AND start_or_stop = true
    `;


      const result = await client.query(query);
      const notifications = result.rows;

      notifications.forEach((notif: any) => {
        const {
          ntf_id,
          table_names,
          transaction_type,
          column_condition,
          frequency,
          frequency_accurrence,
          frequency_time_gap,
          frequency_first_alert
        } = notif;

        // determine target tables
        const targetTables =
          table_names && table_names.trim()
            ? table_names.split(",").map((t: string) => t.trim())
            : transactionTablesMap[transaction_type] || [];

        if (targetTables.length === 0) {
          console.warn(`No tables defined for ntf_id=${ntf_id}`);
          return;
        }

        function parseCondition(c: string) {
          let col = "";
          let op = "";
          let value = "";
          for (const [key, sqlOp] of Object.entries(operatorMap)) {
            const regex = new RegExp(`\\s${key}\\s`, "i");
            if (regex.test(c)) {
              const [left, right] = c.split(regex);
              col = left.trim();
              op = key;
              value = right.trim();
              return { col, op, value, sqlOp };
            }
          }
          return null; // No valid operator
        }

        // build WHERE clauses
        // Regex to match conditions and operators
        const regex = /(.+?)(?=\s+(AND|OR)\s+|$)/gi;
        const matches = [...column_condition.matchAll(regex)];

        if (!matches || matches.length === 0) {
          console.error(`No valid conditions parsed for ntf_id=${ntf_id}. Raw column_condition: ${column_condition}`);
          return;
        }

        const whereParts: string[] = [];
        const requiredColumns: string[] = [];

        matches.forEach((match) => {
          const conditionStr = match[1].trim();
          const connector = match[2]?.toUpperCase()?.trim(); // 'AND' | 'OR' | undefined

          const parsed = parseCondition(conditionStr);
          if (parsed) {
            const { col, sqlOp, value } = parsed;
            requiredColumns.push(col);
            const part = isNaN(Number(value))
              ? `${col} ${sqlOp} '${value}'`
              : `${col} ${sqlOp} ${value}`;
            if (whereParts.length > 0 && connector) {
              whereParts.push(connector);
            }
            whereParts.push(part);
          }
        });

        // Rebuild WHERE clause preserving AND / OR
        const whereClause = whereParts.join(" ");

        // schedule cron based on frequency
        const cronExpr = buildCronExpression(
          frequency,
          frequency_first_alert,
          frequency_accurrence,
          frequency_time_gap
        );

        cron.schedule(cronExpr, async () => {
          try {
            // fetch email template
            const commQuery = `
            SELECT *
            FROM notification_communication_channel
            WHERE ntf_id = $1 AND is_whatsapp = true
          `;


            const commRes = await client.query(commQuery, [ntf_id]);
            if (commRes.rows.length === 0) {
              return;
            }

            const { templet_id } = commRes.rows[0];

            // fetch recipients
            const recQuery = `
            SELECT *
            FROM notification_recipient
            WHERE ntf_id = $1 AND is_whatsapp = true
          `;
            const recRes = await client.query(recQuery, [ntf_id]);
            const recipients = recRes.rows;
            if (recipients.length === 0) {
              return;
            }

            const phoneNumbersToSend: string[] = [];

            for (const r of recipients) {
              if (r.specific_users && r.specific_users.length > 0) {
                // specific_users assumed to be phone numbers
                phoneNumbersToSend.push(...r.specific_users);
              } else if (r.recipient_users && r.recipient_users.length > 0) {
                const uQuery = `
                SELECT user_phone_number
                FROM users_table
                WHERE user_id = ANY($1)
              `;
                const uRes = await client.query(uQuery, [r.recipient_users]);
                uRes.rows.forEach((u: any) => {
                  if (u.user_phone_number) {
                    phoneNumbersToSend.push(`91${u.user_phone_number}`);
                  }
                });
              }
            }

            if (phoneNumbersToSend.length === 0) {
              return;
            }

            // Fetch matching data
            const dataResults: any = [];
            for (const table of targetTables) {
              // Check if this table has all required columns
              const colQuery = `
              SELECT column_name
              FROM information_schema.columns
              WHERE table_name = $1
            `;
              const colRes = await client.query(colQuery, [table]);
              const tableColumns = colRes.rows.map((r: any) => r.column_name);

              const hasAllColumns = requiredColumns.every((c) => tableColumns.includes(c));
              if (!hasAllColumns) {
                continue;
              }

              const q = `SELECT * FROM ${table} WHERE ${whereClause}`;
              const dRes = await client.query(q);
              dataResults.push(...dRes.rows);
            }

            if (dataResults.length === 0) {
              return;
            }

            // Build text message
            // let textMessage = `${body}\n\nDetails:\n`;

            // dataResults.forEach((row) => {
            //   const idColumn = Object.keys(row).find(k => k.endsWith("_id")) || "id";
            //   if (row[idColumn] !== undefined) {
            //     textMessage += `\n${idColumn}: ${row[idColumn]}`;
            //   }
            //   requiredColumns.forEach((col) => {
            //     if (row[col] !== undefined) {
            //       textMessage += `\n${col}: ${row[col]}`;
            //     }
            //   });
            //   textMessage += `\n`;
            // });

            // Send WhatsApp messages
            for (const phone of phoneNumbersToSend) {
              // await whatsappMiddleware(phone, templet_id);
            }
          } catch (err) {
            console.error(`Error processing ntf_id=${ntf_id}:`, err);
          }
        });

      });
    } catch (error) {
      console.error("Error scheduling notifications:", error);
    }
  });
}

export async function scheduleNotificationsToSMS() {
  return withClient(async (client: any) => {
    try {

      const query = `
      SELECT *
      FROM notification
      WHERE condition_type = 'Simple Condition'
        AND is_sms = true
        AND start_or_stop = true
    `;


      const result = await client.query(query);
      const notifications = result.rows;

      notifications.forEach((notif: any) => {
        const {
          ntf_id,
          table_names,
          transaction_type,
          column_condition,
          frequency,
          frequency_accurrence,
          frequency_time_gap,
          frequency_first_alert
        } = notif;

        // determine target tables
        const targetTables =
          table_names && table_names.trim()
            ? table_names.split(",").map((t: string) => t.trim())
            : transactionTablesMap[transaction_type] || [];

        if (targetTables.length === 0) {
          console.warn(`No tables defined for ntf_id=${ntf_id}`);
          return;
        }

        function parseCondition(c: string) {
          let col = "";
          let op = "";
          let value = "";
          for (const [key, sqlOp] of Object.entries(operatorMap)) {
            const regex = new RegExp(`\\s${key}\\s`, "i");
            if (regex.test(c)) {
              const [left, right] = c.split(regex);
              col = left.trim();
              op = key;
              value = right.trim();
              return { col, op, value, sqlOp };
            }
          }
          return null; // No valid operator
        }

        // build WHERE clauses
        // Regex to match conditions and operators
        const regex = /(.+?)(?=\s+(AND|OR)\s+|$)/gi;
        const matches = [...column_condition.matchAll(regex)];

        if (!matches || matches.length === 0) {
          console.error(`No valid conditions parsed for ntf_id=${ntf_id}. Raw column_condition: ${column_condition}`);
          return;
        }

        const whereParts: string[] = [];
        const requiredColumns: string[] = [];

        matches.forEach((match) => {
          const conditionStr = match[1].trim();
          const connector = match[2]?.toUpperCase()?.trim(); // 'AND' | 'OR' | undefined

          const parsed = parseCondition(conditionStr);
          if (parsed) {
            const { col, sqlOp, value } = parsed;
            requiredColumns.push(col);
            const part = isNaN(Number(value))
              ? `${col} ${sqlOp} '${value}'`
              : `${col} ${sqlOp} ${value}`;
            if (whereParts.length > 0 && connector) {
              whereParts.push(connector);
            }
            whereParts.push(part);
          }
        });

        // Rebuild WHERE clause preserving AND / OR
        const whereClause = whereParts.join(" ");

        // schedule cron based on frequency
        const cronExpr = buildCronExpression(
          frequency,
          frequency_first_alert,
          frequency_accurrence,
          frequency_time_gap
        );

        cron.schedule(cronExpr, async () => {
          try {
            // fetch email template
            const commQuery = `
            SELECT *
            FROM notification_communication_channel
            WHERE ntf_id = $1 AND is_sms = true
          `;


            const commRes = await client.query(commQuery, [ntf_id]);
            if (commRes.rows.length === 0) {
              return;
            }

            const { templet_id } = commRes.rows[0];

            // fetch recipients
            const recQuery = `
            SELECT *
            FROM notification_recipient
            WHERE ntf_id = $1 AND is_sms = true
          `;
            const recRes = await client.query(recQuery, [ntf_id]);
            const recipients = recRes.rows;
            if (recipients.length === 0) {
              return;
            }

            const phoneNumbersToSend: string[] = [];

            for (const r of recipients) {
              if (r.specific_users && r.specific_users.length > 0) {
                // specific_users assumed to be phone numbers
                phoneNumbersToSend.push(...r.specific_users);
              } else if (r.recipient_users && r.recipient_users.length > 0) {
                const uQuery = `
                SELECT user_phone_number
                FROM users_table
                WHERE user_id = ANY($1)
              `;
                const uRes = await client.query(uQuery, [r.recipient_users]);
                uRes.rows.forEach((u: any) => {
                  if (u.user_phone_number) {
                    phoneNumbersToSend.push(u.user_phone_number);
                  }
                });
              }
            }

            if (phoneNumbersToSend.length === 0) {
              return;
            }

            // Fetch matching data
            const dataResults: any = [];
            for (const table of targetTables) {
              // Check if this table has all required columns
              const colQuery = `
              SELECT column_name
              FROM information_schema.columns
              WHERE table_name = $1
            `;
              const colRes = await client.query(colQuery, [table]);
              const tableColumns = colRes.rows.map((r: any) => r.column_name);

              const hasAllColumns = requiredColumns.every((c) => tableColumns.includes(c));
              if (!hasAllColumns) {
                continue;
              }

              const q = `SELECT * FROM ${table} WHERE ${whereClause}`;

              const dRes = await client.query(q);
              dataResults.push(...dRes.rows);
            }

            if (dataResults.length === 0) {
              return;
            }

            // Build text message
            // let textMessage = `${body}\n\nDetails:\n`;

            // dataResults.forEach((row) => {
            //   const idColumn = Object.keys(row).find(k => k.endsWith("_id")) || "id";
            //   if (row[idColumn] !== undefined) {
            //     textMessage += `\n${idColumn}: ${row[idColumn]}`;
            //   }
            //   requiredColumns.forEach((col) => {
            //     if (row[col] !== undefined) {
            //       textMessage += `\n${col}: ${row[col]}`;
            //     }
            //   });
            //   textMessage += `\n`;
            // });

            for (const phone of phoneNumbersToSend) {
              // await smsMiddleware('7338578203', templet_id);
            }
          } catch (err) {
            console.error(`Error processing ntf_id=${ntf_id}:`, err);
          }
        });

      });
    } catch (error) {
      console.error("Error scheduling notifications:", error);
    }
  });
}

function buildCronExpression(
  frequency: string,
  firstAlert: string,
  accurrence: string,
  timeGap: string
): string {
  const [hour, minute] = firstAlert.split(":").map(Number);
  if (frequency === "Daily") {
    return `${minute} ${hour} * * *`;
  }
  if (frequency === "Weekly") {
    const day = accurrence.match(/\d+/)?.[0] || "1";
    return `${minute} ${hour} * * ${day}`;
  }
  if (frequency === "Monthly") {
    const day = accurrence.match(/\d+/)?.[0] || "1";
    return `${minute} ${hour} ${day} * *`;
  }
  return "* * * * *"; // fallback
}


export async function sendNotificationImmediate(ntf_id: string) {
  return withClient(async (client: any) => {
    try {

      const notifRes = await client.query(
        `SELECT * FROM notification WHERE ntf_id = $1 AND is_email = true AND frequency = 'Immediate'`,
        [ntf_id]
      );

      if (notifRes.rows.length === 0) return console.log(`No valid notification found`);

      const notif = notifRes.rows[0];
      const { table_names, transaction_type, column_condition } = notif;

      if (!table_names || !transaction_type || !column_condition) return console.log("Missing required fields");

      const tables: string[] = table_names.split(',').map((t: string) => t.trim());
      if (tables.length === 0) return console.log("No tables provided");

      // Define main table and joining key rules
      const mainTableMap: Record<string, { main: string, joinKey: string }> = {
        "Visitor": { main: "visitor", joinKey: "visitor_id" },
        "Govt ids": { main: "govt_id_type", joinKey: "govt_id_type_id" },

      };

      const joinInfo = mainTableMap[transaction_type];
      if (!joinInfo) return console.log(`No join rules found for transaction_type: ${transaction_type}`);

      const { main: mainTable, joinKey } = joinInfo;

      // Parse conditions
      const parsedConditions = parseConditions(column_condition);
      if (parsedConditions.length === 0) return console.log("No valid conditions");


      // const requiredColumns = parsedConditions.map(c => c.col);

      // Fetch columns for all involved tables
      const tableColumns: Record<string, string[]> = {};
      for (const tbl of tables) {
        const colRes = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = $1`, [tbl]);
        tableColumns[tbl] = colRes.rows.map((r: any) => r.column_name);
      }

      // Map condition to its source table
      const conditionParts: string[] = [];
      for (const cond of parsedConditions) {
        const sourceTable = tables.find(tbl => tableColumns[tbl].includes(cond.col));
        if (!sourceTable) {
          continue;
        }

        let expr = "";
        if (cond.isDateKeyword) {
          expr = buildDateCondition(`${sourceTable}.${cond.col}`, cond.value);
        } else {
          expr = isNaN(Number(cond.value))
            ? `${sourceTable}.${cond.col} ${cond.sqlOp} '${cond.value}'`
            : `${sourceTable}.${cond.col} ${cond.sqlOp} ${cond.value}`;
        }

        if (conditionParts.length > 0 && cond.connector) {
          conditionParts.push(cond.connector);
        }
        conditionParts.push(expr);
      }

      const whereClause = conditionParts.join(" ");

      // Build JOINs
      const joinTables = tables.filter(t => t !== mainTable);
      const joinClauses = joinTables.map(tbl => `LEFT JOIN ${tbl} ON ${tbl}.${joinKey} = ${mainTable}.${joinKey}`);

      // Execute final query
      const finalSQL = `SELECT * FROM ${mainTable} ${joinClauses.join(" ")} WHERE ${whereClause}`;
      const result = await client.query(finalSQL);
      const rows = result.rows;

      if (!rows.length) return console.log(`No matching data for ntf_id=${ntf_id}`);

      const requiredColumns = Array.from(new Set([
        ...parsedConditions.map(c => c.col),
        Object.keys(rows[0]).find(k => k.endsWith("_data")) || "invoice_number"
      ]));

      // Prepare Email Template
      const commRes = await client.query(`SELECT * FROM notification_communication_channel WHERE ntf_id = $1 AND is_email = true`, [ntf_id]);
      if (!commRes.rows.length) return console.log("No email template");
      const { subject, body } = commRes.rows[0];

      const recRes = await client.query(`SELECT * FROM notification_recipient WHERE ntf_id = $1 AND is_email = true`, [ntf_id]);
      if (!recRes.rows.length) return console.log("No recipients");

      const emailsToSend: string[] = [];

      for (const r of recRes.rows) {

        // ✅ Process specific_users if they contain valid emails
        if (Array.isArray(r.specific_users)) {
          const validSpecificUsers = (r.specific_users as string[]).filter(u => u && u.trim() !== "");
          if (validSpecificUsers.length > 0) {
            emailsToSend.push(...validSpecificUsers);
          }
        }

        // ✅ Process recipient_users if they contain valid IDs
        if (Array.isArray(r.recipient_users) && r.recipient_users.length > 0) {
          const uRes = await client.query(
            `SELECT user_email FROM users_table WHERE user_id = ANY($1::text[]) AND user_email IS NOT NULL AND user_email <> ''`,
            [r.recipient_users]
          );

          const fetchedEmails = uRes.rows.map((u: any) => u.user_email).filter((email: any) => email && email.trim() !== "");

          if (fetchedEmails.length > 0) {
            emailsToSend.push(...fetchedEmails);
          }
        }
      }

      if (emailsToSend.length === 0) {
        return console.log("No resolved email addresses");
      }



      if (emailsToSend.length === 0) {
        return console.log("No resolved email addresses");
      }



      if (!emailsToSend.length) return console.log("No resolved email addresses");


      // Email HTML
      // const detailsHtml = buildEmailHtmlFromRows(rows, requiredColumns, tables);
      // const finalHtml = `<p>${body}</p><p><strong>Details:</strong></p>${detailsHtml}`;
      // await sendEmail(emailsToSend, subject, finalHtml);

      let finalHtml = `<p>${body}</p>`;
      let attachmentsArray: any[] = [];

      if (commRes.rows[0].attachments && commRes.rows[0].attachments.includes("Envigude Data")) {

        const pdfBuffer = await generateInvoicePDF(rows, requiredColumns);
        attachmentsArray.push({
          filename: 'enviguide-data.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf'
        });

        finalHtml += `<p><strong>Envigude Data has been attached as a PDF file.</strong></p>`;
      } else {
        const detailsHtml = buildEmailHtmlFromRows(rows, requiredColumns, tables);
        finalHtml += `<p><strong>Details:</strong></p>${detailsHtml}`;
      }
      await sendEmail(emailsToSend, subject, finalHtml, attachmentsArray);

      const nth_id = ulid();
      await client.query(
        `INSERT INTO notification_triggered_history (nth_id, ntf_id, status) VALUES ($1, $2, $3)`,
        [nth_id, ntf_id, 'Success']
      );

    } catch (error) {
      console.error("Error in sendNotificationImmediate:", error);
    }

    // Helpers
    function parseConditions(condStr: string) {
      const operatorMap: Record<string, string> = {
        "equal to": "=",
        "greater than": ">",
        "less than": "<",
        "not equal to": "!=",
        "greater than or equal to": ">=",
        "less than or equal to": "<=",
        "like": "ILIKE"
      };

      const dateKeywords = ["today", "yesterday", "this week", "this month", "this quarter", "this year"];

      const tokens = condStr.split(/\s+(AND|OR)\s+/i);
      const result: { col: string; sqlOp: string; value: string; connector?: string; isDateKeyword?: boolean }[] = [];

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i].trim();
        if (!token) continue;

        if (token.toUpperCase() === "AND" || token.toUpperCase() === "OR") continue;

        const connector = i > 0 && tokens[i - 1].match(/AND|OR/i) ? tokens[i - 1].toUpperCase() : undefined;

        for (const [key, sqlOp] of Object.entries(operatorMap)) {
          const opRegex = new RegExp(`\\s${key}\\s`, "i");
          if (opRegex.test(token)) {
            const [col, val] = token.split(opRegex);
            const trimmedVal = val.trim();
            const isDateKeyword = dateKeywords.includes(trimmedVal.toLowerCase());
            result.push({
              col: col.trim(),
              sqlOp,
              value: trimmedVal,
              connector,
              isDateKeyword
            });
            break;
          }
        }
      }

      return result;
    }

    function buildDateCondition(column: string, keyword: string): string {
      switch (keyword.toLowerCase()) {
        case "today":
          return `DATE(${column}) = CURRENT_DATE`;
        case "yesterday":
          return `DATE(${column}) = CURRENT_DATE - INTERVAL '1 day'`;
        case "this week":
          return `DATE(${column}) >= date_trunc('week', CURRENT_DATE)`;
        case "this month":
          return `DATE(${column}) >= date_trunc('month', CURRENT_DATE)`;
        case "this quarter":
          return `DATE(${column}) >= date_trunc('quarter', CURRENT_DATE)`;
        case "this year":
          return `DATE(${column}) >= date_trunc('year', CURRENT_DATE)`;
        default:
          return `DATE(${column}) = CURRENT_DATE`;
      }
    }

    // function buildEmailHtmlFromRows(rows: any[], columns: string[]): string {
    //   let html = '<ul>';
    //   for (const row of rows) {
    //     html += '<li>';
    //     const idColumn = Object.keys(row).find(k => k.endsWith("_data")) || "invoice_number";
    //     html += `<strong>${idColumn}:</strong> ${row[idColumn]}<br/>`;
    //     columns.forEach(col => {
    //       if (row[col] !== undefined) html += `<strong>${col}:</strong> ${row[col]}<br/>`;
    //     });
    //     html += '</li><br/>';
    //   }
    //   html += '</ul>';
    //   return html;
    // }
    function buildEmailHtmlFromRows(rows: any[], columns: string[], tables: string[]): string {
      let html = '<ul>';

      for (const row of rows) {
        html += '<li>';

        columns.forEach(col => {
          if (row[col] !== undefined) {
            const label = getLabelForColumn(col, tables);
            html += `<strong>${label}:</strong> ${row[col]}<br/>`;
          }
        });

        html += '</li><br/>';
      }

      html += '</ul>';
      return html;
    }

    // Helper to get label name for a column
    function getLabelForColumn(column: string, tables: string[]): string {
      // Force "Enviguide Data" if column ends with _data
      if (column.endsWith("_data")) {
        return "Enviguide Data";
      }

      // Check if label exists in columnConfig
      for (const table of tables) {
        if (columnConfig[table]) {
          const colObj = columnConfig[table].find(c => c.value === column);
          if (colObj) return colObj.label;
        }
      }

      // Fallback: Format column name (replace _ with space and capitalize)
      return column
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    }
  });
}





export async function sendNotificationSqlQueryImmediate(ntf_id: string) {
  return withClient(async (client: any) => {
    try {

      const notifRes = await client.query(
        `SELECT * FROM notification WHERE ntf_id = $1 AND condition_type = 'SQL Query' AND frequency = 'Immediate' AND (sql_query != '' OR sql_query IS NOT NULL)`,
        [ntf_id]
      );

      if (notifRes.rows.length === 0) {
        return;
      }

      const notif = notifRes.rows[0];
      const sqlQuery = notif.sql_query;
      const transactionType = notif.transaction_type;

      if (!sqlQuery || !transactionType) {
        return;
      }


      const allowedTables: string[] = transactionType
        .split(',')
        .map((t: string) => t.trim())
        .flatMap((type: string) => transactionTablesMap[type] || []);


      const queryTables = extractTableNamesFromSQL(sqlQuery);
      const allTablesValid = queryTables.every(tbl => allowedTables.includes(tbl));

      if (!allTablesValid) {
        return;
      }

      const commRes = await client.query(
        `SELECT * FROM notification_communication_channel WHERE ntf_id = $1 AND is_email = true`,
        [ntf_id]
      );
      if (commRes.rows.length === 0) {
        return;
      }
      const { subject, body } = commRes.rows[0];

      const recRes = await client.query(
        `SELECT * FROM notification_recipient WHERE ntf_id = $1 AND is_email = true`,
        [ntf_id]
      );
      if (recRes.rows.length === 0) {
        return;
      }

      // const emailsToSend: string[] = [];
      // for (const r of recRes.rows) {
      //   if (r.specific_users?.length) {
      //     emailsToSend.push(...r.specific_users);
      //   } else if (r.recipient_users?.length) {
      //     const uRes = await client.query(
      //       `SELECT user_email FROM users_table WHERE user_id = ANY($1)`,
      //       [r.recipient_users]
      //     );
      //     emailsToSend.push(...uRes.rows.map(u => u.user_email));
      //   }
      // }

      const emailsToSend: string[] = [];

      for (const r of recRes.rows) {

        // ✅ Process specific_users if they contain valid emails
        if (Array.isArray(r.specific_users)) {
          const validSpecificUsers = (r.specific_users as string[]).filter(u => u && u.trim() !== "");
          if (validSpecificUsers.length > 0) {
            emailsToSend.push(...validSpecificUsers);
          }
        }

        // ✅ Process recipient_users if they contain valid IDs
        if (Array.isArray(r.recipient_users) && r.recipient_users.length > 0) {
          const uRes = await client.query(
            `SELECT user_email FROM users_table WHERE user_id = ANY($1::text[]) AND user_email IS NOT NULL AND user_email <> ''`,
            [r.recipient_users]
          );

          const fetchedEmails = uRes.rows.map((u: any) => u.user_email).filter((email: any) => email && email.trim() !== "");

          if (fetchedEmails.length > 0) {
            emailsToSend.push(...fetchedEmails);
          }
        }
      }

      if (emailsToSend.length === 0) {
        return;
      }

      let queryResults = [];
      try {
        const result = await client.query(sqlQuery);
        queryResults = result.rows;
      } catch (err) {
        console.error(`Error executing custom SQL query for ntf_id=${ntf_id}:`, String(err));
        return;
      }

      if (!queryResults.length) {
        console.log(`No data returned from SQL query for ntf_id=${ntf_id}`);
        return;
      }

      // const detailsHtml = buildEmailHtmlFromRows(queryResults);
      // const finalHtml = `<p>${body}</p><p><strong>Details:</strong></p>${detailsHtml}`;

      // await sendEmail(emailsToSend, subject, finalHtml);
      // console.log(`SQL Query Email sent for ntf_id=${ntf_id}`);

      let finalHtml = `<p>${body}</p>`;
      let attachmentsArray: any[] = [];

      if (commRes.rows[0].attachments && commRes.rows[0].attachments.includes("Envigude Data")) {

        const columns = Object.keys(queryResults[0]);
        const pdfBuffer = await generateInvoiceSqlPDF(queryResults, columns, queryTables);

        attachmentsArray.push({
          filename: 'enviguide-data.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf'
        });

        finalHtml += `<p><strong>Envigude Data has been attached as a PDF file.</strong></p>`;
      } else {
        const detailsHtml = buildEmailHtmlFromRows(queryResults, queryTables);
        finalHtml += `<p><strong>Details:</strong></p>${detailsHtml}`;
      }

      await sendEmail(emailsToSend, subject, finalHtml, attachmentsArray);

      const nth_id = ulid();
      await client.query(
        `INSERT INTO notification_triggered_history (nth_id, ntf_id, status) VALUES ($1, $2, $3)`,
        [nth_id, ntf_id, 'Success']
      );

    } catch (error) {
      console.error(`Error in sendNotificationSqlQueryImmediate:`, error);
    }


    function extractTableNamesFromSQL(sql: string): string[] {
      const matches = sql.match(/from\s+(\w+)|join\s+(\w+)/gi) || [];
      return matches
        .map(m => m.replace(/(from|join)\s+/i, '').trim())
        .filter(Boolean);
    }

    function buildEmailHtmlFromRows(rows: any[], tables: string[]): string {
      let html = '<ul>';
      for (const row of rows) {
        html += '<li>';
        for (const key in row) {
          const label = getLabelForColumn(key, tables);
          html += `<strong>${label}:</strong> ${row[key]}<br/>`;
        }
        html += '</li><br/>';
      }
      html += '</ul>';
      return html;
    }

    function getLabelForColumn(column: string, tables: string[]): string {
      if (column.endsWith("_data")) {
        return "Enviguide Data";
      }
      for (const table of tables) {
        if (columnConfig[table]) {
          const colObj = columnConfig[table].find(c => c.value === column);
          if (colObj) return colObj.label;
        }
      }
      return column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  });
}

// ======>SQL Query Notification<=======
export async function scheduleSqlQueryNotifications() {
  return withClient(async (client: any) => {
    try {

      const query = `
      SELECT *
      FROM notification
      WHERE condition_type = 'SQL Query'
        AND is_email = true
        AND frequency != 'Immediate'
        AND start_or_stop = true
    `;

      const result = await client.query(query);
      const notifications = result.rows;

      notifications.forEach((notif: any) => {
        const {
          ntf_id,
          sql_query,
          transaction_type,
          frequency,
          frequency_accurrence,
          frequency_time_gap,
          frequency_first_alert,
          created_date
        } = notif;

        if (!sql_query || !transaction_type) {
          console.warn(`Missing sql_query or transaction_type for ntf_id=${ntf_id}`);
          return;
        }

        const allowedTables = transaction_type
          .split(',')
          .map((t: string) => t.trim())
          .flatMap((type: string) => transactionTablesMap[type] || []);

        const queryTables = extractTableNamesFromSQL(sql_query);
        const allTablesValid = queryTables.every(tbl => allowedTables.includes(tbl));

        if (!allTablesValid) {
          console.warn(`Invalid tables used in sql_query for ntf_id=${ntf_id}`);
          return;
        }

        const cronExprs = buildCronExpressions(
          frequency,
          frequency_first_alert,
          frequency_accurrence,
          frequency_time_gap
        );

        cronExprs.forEach(cronExpr => {
          cron.schedule(cronExpr, async () => {
            console.log(`Running SQL Query job for ntf_id=${ntf_id}`);
            try {

              // ✅ Check history & limit
              const histQuery = `
                SELECT created_date
                FROM notification_triggered_history
                WHERE ntf_id = $1
                AND ${getDateCondition(frequency, created_date)}
                ORDER BY created_date DESC
              `;

              const histRes = await client.query(histQuery, [ntf_id]);


              // ✅ Stop after limit
              if (histRes.rows.length >= parseInt(frequency_accurrence)) {
                return;
              }

              // ✅ Check gap
              if (histRes.rows.length > 0) {

                const lastTriggered = new Date(histRes.rows[0].created_date);
                const now = new Date();
                const gapMinutes = parseInt(frequency_time_gap) * 60;
                const diffMinutes = Math.abs((now.getTime() - lastTriggered.getTime()) / (1000 * 60));

                if (diffMinutes < gapMinutes) {
                  return;
                }
              }

              const commRes = await client.query(
                `SELECT subject, body ,attachments FROM notification_communication_channel WHERE ntf_id = $1 AND is_email = true`,
                [ntf_id]
              );
              if (commRes.rows.length === 0) return;

              const { subject, body, attachments } = commRes.rows[0];

              const recRes = await client.query(
                `SELECT * FROM notification_recipient WHERE ntf_id = $1 AND is_email = true`,
                [ntf_id]
              );
              if (recRes.rows.length === 0) return;

              // const emailsToSend: string[] = [];
              // for (const r of recRes.rows) {
              //   if (r.specific_users?.length) {
              //     emailsToSend.push(...r.specific_users);
              //   } else if (r.recipient_users?.length) {
              //     const uRes = await client.query(
              //       `SELECT user_email FROM users_table WHERE user_id = ANY($1)`,
              //       [r.recipient_users]
              //     );
              //     emailsToSend.push(...uRes.rows.map(u => u.user_email));
              //   }
              // }

              const emailsToSend: string[] = [];

              for (const r of recRes.rows) {

                // ✅ Process specific_users if they contain valid emails
                if (Array.isArray(r.specific_users)) {
                  const validSpecificUsers = (r.specific_users as string[]).filter(u => u && u.trim() !== "");
                  if (validSpecificUsers.length > 0) {
                    emailsToSend.push(...validSpecificUsers);
                  }
                }

                // ✅ Process recipient_users if they contain valid IDs
                if (Array.isArray(r.recipient_users) && r.recipient_users.length > 0) {
                  const uRes = await client.query(
                    `SELECT user_email FROM users_table WHERE user_id = ANY($1::text[]) AND user_email IS NOT NULL AND user_email <> ''`,
                    [r.recipient_users]
                  );

                  const fetchedEmails = uRes.rows.map((u: any) => u.user_email).filter((email: any) => email && email.trim() !== "");

                  if (fetchedEmails.length > 0) {
                    emailsToSend.push(...fetchedEmails);
                  }
                }
              }
              // for (const r of recRes.rows) {
              //   // Check if specific_users exists and has elements
              //   console.log(r.specific_users, "r.specific_usersr.specific_users");
              //   console.log(r.recipient_users, "r.recipient_usersr.recipient_users");
              //   if (Array.isArray(r.specific_users) && r.specific_users.length > 0) {
              //     emailsToSend.push(...r.specific_users);
              //   }
              //   // Check if recipient_users exists and has elements
              //   else if (Array.isArray(r.recipient_users) && r.recipient_users.length > 0) {
              //     console.log(r.recipient_users, "r.recipient_users");

              //     const uRes = await client.query(
              //       `SELECT user_email FROM users_table WHERE user_id = ANY($1)`,
              //       [r.recipient_users]
              //     );

              //     if (uRes.rows.length > 0) {
              //       emailsToSend.push(...uRes.rows.map(u => u.user_email));
              //     }
              //   }
              // }

              if (emailsToSend.length === 0) {
                return;
              }

              let queryResults = [];
              try {
                const result = await client.query(sql_query);
                queryResults = result.rows;
              } catch (err) {

                console.error(`SQL query failed for ntf_id=${ntf_id}:`, String(err));
                return;
              }

              if (queryResults.length === 0) return;

              // const detailsHtml = buildEmailHtmlFromRows(queryResults);
              // const finalHtml = `<p>${body}</p><p><strong>Details:</strong></p>${detailsHtml}`;

              // await sendEmail(emailsToSend, subject, finalHtml);
              // console.log(`Scheduled SQL Email sent for ntf_id=${ntf_id}`);

              let finalHtml = `<p>${body}</p>`;
              let attachmentsArray: any[] = [];


              if (attachments && commRes.rows[0].attachments && commRes.rows[0].attachments.includes("Envigude Data")) {

                const columns = Object.keys(queryResults[0]);
                const pdfBuffer = await generateInvoiceSqlPDF(queryResults, columns, queryTables);

                attachmentsArray.push({
                  filename: 'enviguide-data.pdf',
                  content: pdfBuffer,
                  contentType: 'application/pdf'
                });

                finalHtml += `<p><strong>Envigude Data has been attached as a PDF file.</strong></p>`;
              } else {
                const detailsHtml = buildEmailHtmlFromRows(queryResults, queryTables);
                finalHtml += `<p><strong>Details:</strong></p>${detailsHtml}`;
              }

              await sendEmail(emailsToSend, subject, finalHtml, attachmentsArray);

              const nth_id = ulid();
              await client.query(
                `INSERT INTO notification_triggered_history (nth_id, ntf_id, status) VALUES ($1, $2, $3)`,
                [nth_id, ntf_id, 'Success']
              );

            } catch (err) {
              console.error(`Error in SQL Notification job for ntf_id=${ntf_id}:`, err);
            }
          });

        });

      });

    } catch (error) {
      console.error("Error scheduling SQL notifications:", error);
    }

    function buildCronExpressions(frequency: string, firstAlert: string, accurrence: string, timeGap: string): string[] {
      const [hour, minute] = firstAlert.split(":").map(Number);
      const occurrences = parseInt(accurrence) || 1;
      const gap = parseInt(timeGap) || 0;
      const expressions: string[] = [];

      for (let i = 0; i < occurrences; i++) {
        let newHour = hour + (i * gap);
        if (newHour >= 24) newHour = newHour % 24;

        if (frequency === "Daily") expressions.push(`${minute} ${newHour} * * *`);
        else if (frequency === "Weekly") expressions.push(`${minute} ${newHour} * * 1`);
        else if (frequency === "Monthly") expressions.push(`${minute} ${newHour} 1 * *`);
      }
      return expressions;
    }

    function getDateCondition(frequency: string, created_date: string): string {
      if (frequency === "Daily") return "DATE(created_date) = CURRENT_DATE";
      if (frequency === "Weekly") return `created_date >= date_trunc('week', CURRENT_DATE) AND created_date >= '${created_date}'`;
      if (frequency === "Monthly") return `created_date >= date_trunc('month', CURRENT_DATE) AND created_date >= '${created_date}'`;
      return "1=1";
    }

    function extractTableNamesFromSQL(sql: string): string[] {
      const matches = sql.match(/from\s+(\w+)|join\s+(\w+)/gi) || [];
      return matches
        .map(m => m.replace(/(from|join)\s+/i, '').trim())
        .filter(Boolean);
    }

    function buildEmailHtmlFromRows(rows: any[], tables: string[]): string {
      let html = '<ul>';
      for (const row of rows) {
        html += '<li>';
        for (const key in row) {
          const label = getLabelForColumn(key, tables);
          html += `<strong>${label}:</strong> ${row[key]}<br/>`;
        }
        html += '</li><br/>';
      }
      html += '</ul>';
      return html;
    }

    function getLabelForColumn(column: string, tables: string[]): string {
      if (column.endsWith("_data")) {
        return "Enviguide Data";
      }
      for (const table of tables) {
        if (columnConfig[table]) {
          const colObj = columnConfig[table].find(c => c.value === column);
          if (colObj) return colObj.label;
        }
      }
      return column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  });
}
