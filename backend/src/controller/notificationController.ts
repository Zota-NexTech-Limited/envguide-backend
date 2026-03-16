import { generateResponse } from '../util/genRes';
import { addNotificationDetails, updateNotificationDetails, getNotificationLists, getNotificationListByIds, getAllAlertsLists } from '../services/notificationService';
import { withClient } from '../util/database';
import { sendNotificationImmediate, sendNotificationSqlQueryImmediate } from '../helper/cron_notification_alert';
import { columnConfig } from "../helper/columnConfig ";

export async function notificationCreate(req: any, res: any) {
  return withClient(async (client: any) => {
    const { notificationData, notificationCommunicationData, notificationRecipientsData } = req.body;

    const notificationRecipentsData = notificationRecipientsData;

    try {

      if (!notificationData || !notificationCommunicationData || !notificationRecipentsData || notificationCommunicationData.length <= 0 || notificationRecipentsData.length <= 0) {
        return res.status(400).send(
          generateResponse(false, "NotificationData and notificationCommunicationData and notificationRecipentsData inside fields are required", 400, null)
        )
      }

      notificationData.created_by = req.user_id;

      const checkAlertQuery = `
      SELECT alert_name 
      FROM notification 
      WHERE LOWER(alert_name) = LOWER($1)
      LIMIT 1;
    `;
      const checkAlert = await client.query(checkAlertQuery, [notificationData.alert_name]);

      if (checkAlert.rows.length > 0) {
        return res.status(400).send(
          generateResponse(false, `Alert name '${notificationData.alert_name}' already exists`, 400, null)
        );
      }

      const addNotification = await addNotificationDetails(notificationData, notificationCommunicationData, notificationRecipentsData);

      if (addNotification) {

        if (notificationData.is_email) {
          if (notificationData.condition_type === 'SQL Query' && notificationData.frequency === "Immediate") {
            await sendNotificationSqlQueryImmediate(addNotification.notificationData.ntf_id)
          } else if (notificationData.condition_type === 'Simple Condition' && notificationData.frequency === "Immediate") {
            await sendNotificationImmediate(addNotification.notificationData.ntf_id);
          }
        }

        // if (notificationData.is_sms) {

        //   if (notificationData.condition_type === 'Simple Condition' && notificationData.frequency === "Immediate") {
        //     await sendNotificationImmediateToSMS(addNotification.notificationData.ntf_id)
        //   }


        // }

        // if (notificationData.is_whatsapp) {

        //   if (notificationData.condition_type === 'Simple Condition' && notificationData.frequency === "Immediate") {
        //     await sendNotificationImmediateToWhatsapp(addNotification.notificationData.ntf_id)
        //   }

        // }


        if (notificationData.is_push_notification) {

        }


        // Transform Communication Data
        const formattedCommunicationData = addNotification.notificationCommunicationData.map((item: any) => {
          const type = item.type;

          const obj: any = {
            ntfcc_id: item.ntfcc_id,
            ntf_id: item.ntf_id,
            type,
            template_name: item.template_name || "",
            subject: item.subject || "",
            body: item.body || "",
            attachments: item.attachments || "",
            transaction_status: item.transaction_status,
            review_required: item.review_required || false,
            notification_count: item.notification_count || true,
            created_by: item.created_by,
            updated_by: item.updated_by,
            update_date: item.update_date,
            created_date: item.created_date
          };

          // Add only the relevant flag
          if (type === "email") obj.is_email = item.is_email;
          else if (type === "sms") obj.is_sms = item.is_sms;
          else if (type === "whatsapp") obj.is_whatsapp = item.is_whatsapp;
          else if (type === "notification") obj.is_push_notification = item.is_push_notification;

          return obj;
        });

        // Transform Recipients Data
        const formattedRecipientsData = addNotification.notificationRecipientsData.map((item: any) => {
          const type = item.type;

          const obj: any = {
            ntfr_id: item.ntfr_id,
            ntfcc_id: item.ntfcc_id,
            type,
            specific_users: item.specific_users || [],
            recipient_group: item.recipient_group || [],
            recipient_users: item.recipient_users || [],
            created_by: item.created_by,
            updated_by: item.updated_by,
            update_date: item.update_date,
            created_date: item.created_date
          };

          // Add only the relevant flag
          if (type === "email") obj.is_email = item.is_email;
          else if (type === "sms") obj.is_sms = item.is_sms;
          else if (type === "whatsapp") obj.is_whatsapp = item.is_whatsapp;
          else if (type === "notification") obj.is_push_notification = item.is_push_notification;

          return obj;
        });

        return res.status(200).send(
          generateResponse(true, "Notification placed successfully", 200, {
            notificationData: addNotification.notificationData,
            notificationCommunicationData: formattedCommunicationData,
            notificationRecipientsData: formattedRecipientsData
          })
        );

      } else {
        return res.status(400).send(
          generateResponse(false, "Notification placing unsuccesfully", 400, null)
        )
      }

    }

    catch (error) {
      console.log(error)

    }
  });
}

export async function notificationUpdate(req: any, res: any) {
  return withClient(async (client: any) => {
    const { notificationData, notificationCommunicationData, notificationRecipientsData } = req.body;

    const notificationRecipentsData = notificationRecipientsData;
    try {

      if (!notificationData || !notificationCommunicationData || !notificationRecipentsData || notificationCommunicationData.length <= 0 || notificationRecipentsData.length <= 0) {
        return res.status(400).send(
          generateResponse(false, "notificationData and notificationCommunicationData and notificationRecipentsData inside fields are required", 400, null)
        )
      }

      if (!notificationData.ntf_id || notificationData.ntf_id === "") {
        return res.status(400).send(generateResponse(false, "ntf_id is required for update.", 400, null));
      }

      const invalidComm = notificationCommunicationData?.filter(
        (c: any) => (c.ntfcc_id === "" || c.ntfcc_id === null)
      );
      if (invalidComm.length > 0) {
        return res.status(400).send(generateResponse(false, "One or more communication records are missing ntfcc_id.", 400, null));
      }

      const invalidRecips = notificationRecipentsData?.filter(
        (r: any) => (r.ntfr_id === "" || r.ntfr_id === null)
      );
      if (invalidRecips.length > 0) {
        return res.status(400).send(generateResponse(false, "One or more recipient records are missing ntfr_id.", 400, null));
      }

      notificationData.updated_by = req.user_id;

      const checkAlertQuery = `
  SELECT ntf_id 
  FROM notification 
  WHERE LOWER(alert_name) = LOWER($1)
    AND ntf_id <> $2
  LIMIT 1;
`;

      const checkAlert = await client.query(checkAlertQuery, [
        notificationData.alert_name,
        notificationData.ntf_id
      ]);

      if (checkAlert.rows.length > 0) {
        return res.status(400).send(
          generateResponse(false,
            `Alert name '${notificationData.alert_name}' already exists`,
            400,
            null
          )
        );
      }

      const addNotification = await updateNotificationDetails(notificationData, notificationCommunicationData, notificationRecipentsData);

      if (addNotification) {

        // if (notificationData.condition_type === 'SQL Query' && notificationData.frequency === "Immediate") {
        //   await sendNotificationSqlQueryImmediate(addNotification.updatedNotification.ntf_id)
        // } else if (notificationData.condition_type === 'Simple Condition' && notificationData.frequency === "Immediate") {
        //   await sendNotificationImmediate(addNotification.updatedNotification.ntf_id);
        // }




        if (notificationData.is_email) {
          if (notificationData.condition_type === 'SQL Query' && notificationData.frequency === "Immediate") {
            await sendNotificationSqlQueryImmediate(addNotification.updatedNotification.ntf_id)
          } else if (notificationData.condition_type === 'Simple Condition' && notificationData.frequency === "Immediate") {
            await sendNotificationImmediate(addNotification.updatedNotification.ntf_id);
          }
        }

        // if (notificationData.is_sms) {

        //   if (notificationData.condition_type === 'Simple Condition' && notificationData.frequency === "Immediate") {
        //     await sendNotificationImmediateToSMS(addNotification.updatedNotification.ntf_id)
        //   }


        // }

        // if (notificationData.is_whatsapp) {

        //   if (notificationData.condition_type === 'Simple Condition' && notificationData.frequency === "Immediate") {
        //     await sendNotificationImmediateToWhatsapp(addNotification.updatedNotification.ntf_id)
        //   }

        // }


        if (notificationData.is_push_notification) {

        }




        const formattedCommunicationData = addNotification.updatedCommunicationChannels.map((item: any) => {
          const type = item.type;

          const obj: any = {
            ntfcc_id: item.ntfcc_id,
            ntf_id: item.ntf_id,
            type: type,
            template_name: item.template_name || "",
            subject: item.subject || "",
            body: item.body || "",
            attachments: item.attachments || "",
            transaction_status: item.transaction_status,
            review_required: item.review_required || false,
            notification_count: item.notification_count || true,
            created_by: item.created_by,
            updated_by: item.updated_by,
            update_date: item.update_date,
            created_date: item.created_date
          };

          // ✅ Add only the relevant flag
          if (type === "email") obj.is_email = item.is_email;
          else if (type === "sms") obj.is_sms = item.is_sms;
          else if (type === "whatsapp") obj.is_whatsapp = item.is_whatsapp;
          else if (type === "notification") obj.is_push_notification = item.is_push_notification;

          return obj;
        });


        // ✅ Transform Recipients Data
        const formattedRecipientsData = addNotification.updatedRecipients.map((item: any) => {
          const type = item.type;

          const obj: any = {
            ntfr_id: item.ntfr_id,
            ntfcc_id: item.ntfcc_id,
            type: type,
            specific_users: item.specific_users || [],
            recipient_group: item.recipient_group || [],
            recipient_users: item.recipient_users || [],
            created_by: item.created_by,
            updated_by: item.updated_by,
            update_date: item.update_date,
            created_date: item.created_date
          };

          // ✅ Add only the relevant flag
          if (type === "email") obj.is_email = item.is_email;
          else if (type === "sms") obj.is_sms = item.is_sms;
          else if (type === "whatsapp") obj.is_whatsapp = item.is_whatsapp;
          else if (type === "notification") obj.is_push_notification = item.is_push_notification;

          return obj;
        });

        return res.status(200).send(
          generateResponse(true, "Notification updated successfully", 200, {
            notificationData: addNotification.updatedNotification,
            notificationCommunicationData: formattedCommunicationData,
            notificationRecipientsData: formattedRecipientsData
          })
        );

      } else {
        return res.status(400).send(
          generateResponse(false, "Notification updating unsuccesfully", 400, null)
        )
      }

    }

    catch (error) {
      console.log(error)

    }
  });
}

export async function getNotificationList(req: any, res: any) {
  return withClient(async (client: any) => {

    try {

      const { searchColumn, searchValue, sortBy, sortOrder, page_no, from_date, to_date, statusFilter, channel_values } = req.query;

      const data = await getNotificationLists(searchColumn, searchValue, sortBy, sortOrder, page_no, from_date, to_date, statusFilter, channel_values);

      return res.status(200).send(generateResponse(true, "Notification fetched successfully", 200, data));
    } catch (error: any) {
      console.error("Error fetching Notification:", error);
      return res.status(500).send(generateResponse(false, error.message, 500, null));
    }
  });

}

export async function getNotificationListById(req: any, res: any) {
  return withClient(async (client: any) => {

    try {

      const { ntf_id } = req.query;

      if (!ntf_id) {
        throw new Error("ntf_id is required");
      }
      const data = await getNotificationListByIds(ntf_id);

      return res.status(200).send(generateResponse(true, "Notification fetched successfully", 200, data));
    } catch (error: any) {
      console.error("Error fetching Notification:", error);
      return res.status(500).send(generateResponse(false, error.message, 500, null));
    }
  });

}

// DropDowns=======>
const transactionTablesMap: Record<string, string[]> = {
  "Own Emission": [
    "users_table"
  ],
  "product": [
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

export async function fetchTablesUsingTransactiontype(req: any, res: any) {
  return withClient(async (client: any) => {
    const transaction_type = req.query.transaction_type;

    try {
      if (!transaction_type) {
        return res.status(400).send(
          generateResponse(false, "transaction_type field is required", 400, null)
        );
      }

      const tables = transactionTablesMap[transaction_type];

      if (!tables) {
        return res.status(404).send(
          generateResponse(false, "Invalid transaction type", 404, null)
        );
      }

      return res.status(200).send(
        generateResponse(true, "Successfully fetched table names", 200, {
          tables
        })
      );
    } catch (error) {
      console.error(error);
      return res.status(500).send(
        generateResponse(false, "Internal server error", 500, null)
      );
    }
  });
}

export async function fetchColumnsUsingTableNames(req: any, res: any) {
  return withClient(async (client: any) => {
    try {
      const tablesParam = req.query.tables;

      if (!tablesParam) {
        return res.status(400).send(generateResponse(false, "Tables field is required", 400, null));
      }

      let tables: string[];
      try {
        tables = JSON.parse(tablesParam);
        if (!Array.isArray(tables) || tables.some(t => typeof t !== "string")) {
          throw new Error();
        }
      } catch {
        return res.status(400).send(generateResponse(false, "Tables must be a valid JSON array of strings", 400, null));
      }

      const resultData: Record<string, { value: string; label: string }[]> = {};

      for (const tableName of tables) {
        // Check if table has config
        if (columnConfig[tableName]) {
          resultData[tableName] = columnConfig[tableName];
        } else {
          resultData[tableName] = []; // No mapping found
        }
      }

      return res.status(200).send(
        generateResponse(true, "Fetched columns successfully", 200, {
          columns: resultData
        })
      );

    } catch (error) {
      console.error(error);
      return res.status(500).send(generateResponse(false, "Internal server error", 500, null));
    }
  });
}

export async function getAllAlerts(req: any, res: any) {
  return withClient(async (client: any) => {
    try {
      const { search, page_no } = req.query;

      const data = await getAllAlertsLists(search, page_no);

      return res.status(200).send(generateResponse(true, "Notifications fetched successfully", 200, data));
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      return res.status(500).send(generateResponse(false, error.message, 500, null));
    }
  });
}

export async function startOrStopAMS(req: any, res: any) {
  return withClient(async (client: any) => {
    try {
      const { ntf_id, start_or_stop } = req.body;

      if (!ntf_id) {
        return res
          .status(400)
          .send(generateResponse(false, "ntf_id is required", 400, null));
      }

      // Default to false if undefined
      const startOrStopValue =
        typeof start_or_stop === "boolean" ? start_or_stop : false;

      // Check if notification exists
      const checkQuery = `SELECT ntf_id FROM notification WHERE ntf_id = $1`;
      const checkResult = await client.query(checkQuery, [ntf_id]);

      if (checkResult.rowCount === 0) {
        return res
          .status(404)
          .send(generateResponse(false, "Notification not found", 404, null));
      }


      if (start_or_stop === false) {
        // Update start_or_stop column
        const updateQuery = `
      UPDATE notification
      SET start_or_stop = $2,
      status = 'Paused'
      WHERE ntf_id = $1
    `;
        await client.query(updateQuery, [ntf_id, startOrStopValue]);
      } else {
        const updateQuery = `
      UPDATE notification
      SET start_or_stop = $2,
      status = 'Active'
      WHERE ntf_id = $1
    `;
        await client.query(updateQuery, [ntf_id, startOrStopValue]);
      }


      return res.status(200).send(generateResponse(true, `AMS ${startOrStopValue ? "Started" : "Stopped"} successfully`, 200, "Success"));
    } catch (error: any) {
      console.error("Error in startOrStopAMS:", error);
      return res
        .status(500)
        .send(generateResponse(false, error.message, 500, null));
    }
  });
}

export async function getRoleAndUserList(req: any, res: any) {
  return withClient(async (client: any) => {
    try {
      // Fetch users with their roles
      const query = `
      SELECT user_role, user_id, user_name 
      FROM users_table
      ORDER BY user_role, user_name
    `;
      const result = await client.query(query);

      const rows = result.rows;

      // Build role-wise grouping
      const roleMap: { [user_role: string]: { user_name: string; user_id: string }[] } = {};

      rows.forEach((row: any) => {
        if (!roleMap[row.user_role]) {
          roleMap[row.user_role] = [];
        }
        roleMap[row.user_role].push({
          user_name: row.user_name,
          user_id: row.user_id,
        });
      });

      // Convert to desired array of objects
      const data = Object.keys(roleMap).map((user_role) => ({
        [user_role]: roleMap[user_role],
      }));

      return res
        .status(200)
        .send(generateResponse(true, "User list fetched successfully", 200, data));
    } catch (error: any) {
      console.error("Error fetching users:", error);
      return res
        .status(500)
        .send(generateResponse(false, error.message, 500, null));
    }
  });
}

export async function deleteNotification(req: any, res: any) {
  return withClient(async (client: any) => {
    try {
      const { ntf_id } = req.body;

      if (!ntf_id) {
        return res
          .status(400)
          .send(generateResponse(false, "ntf_id is required", 400, null));
      }

      const checkQuery = `SELECT ntf_id FROM notification WHERE ntf_id = $1`;
      const checkResult = await client.query(checkQuery, [ntf_id]);

      if (checkResult.rowCount === 0) {
        return res
          .status(404)
          .send(generateResponse(false, "Notification not found", 404, null));
      }

      await client.query('BEGIN');

      const deleteCommQuery = `
      DELETE FROM notification_communication_channel
      WHERE ntf_id = $1
    `;
      await client.query(deleteCommQuery, [ntf_id]);

      const deleteRecQuery = `
      DELETE FROM notification_recipient
      WHERE ntf_id = $1
    `;
      await client.query(deleteRecQuery, [ntf_id]);

      const deleteNotifQuery = `
      DELETE FROM notification
      WHERE ntf_id = $1
    `;
      await client.query(deleteNotifQuery, [ntf_id]);

      await client.query('COMMIT');

      return res
        .status(200)
        .send(generateResponse(true, "Notification and related records deleted successfully", 200, "Success"));
    } catch (error: any) {
      console.error("Error in deleteNotification:", error);
      await client.query('ROLLBACK');
      return res
        .status(500)
        .send(generateResponse(false, error.message, 500, null));
    }
  });
}

export async function getSMSTemplateDropDown(req: any, res: any) {
  return withClient(async (client: any) => {
    try {

      let query = `
      SELECT * FROM sms_config WHERE event_name IS NOT NULL AND event_name <> '';
    `;

      const data = await client.query(query);

      return res.status(200).send(generateResponse(true, "Successfully", 200, data.rows));
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      return res.status(500).send(generateResponse(false, error.message, 500, null));
    }
  });
}

export async function getWhatsappTemplateDropDown(req: any, res: any) {
  return withClient(async (client: any) => {
    try {

      let query = `
      SELECT * FROM whatsapp_config WHERE event_name IS NOT NULL AND event_name <> '';
    `;

      const data = await client.query(query);

      return res.status(200).send(generateResponse(true, "Successfully", 200, data.rows));
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      return res.status(500).send(generateResponse(false, error.message, 500, null));
    }
  });
}

export async function fetchSmsWhatsappTemplateUsingConfigId(req: any, res: any) {
  return withClient(async (client: any) => {

    try {

      const { config_id, type } = req.query;

      if (!config_id) {
        throw new Error("config_id is required");
      }
      let data;

      if (type === "sms" && config_id) {

        let query = `SELECT id, template_id FROM sms_config WHERE id = $1; `;

        const dataFound = await client.query(query, [config_id]);

        if (dataFound && dataFound.rows && dataFound.rows[0].template_id) {
          // data = await fetchSmsTemplate(dataFound.rows[0].template_id);
        }

      } else if (type === "whatsapp" && config_id) {
        let query = `SELECT id, template_name FROM whatsapp_config WHERE id = $1; `;

        const dataFound = await client.query(query, [config_id]);

        if (dataFound && dataFound.rows && dataFound.rows[0].template_name) {
          // data = await fetchWhatsAppTemplates(dataFound.rows[0].template_name);
        }

      } else {
        throw new Error("Invalid type. Must be 'sms' or 'whatsapp'");
      }

      return res.status(200).send(generateResponse(true, "Notification fetched successfully", 200, data));
    } catch (error: any) {
      console.error("Error fetching Notification:", error);
      return res.status(500).send(generateResponse(false, error.message, 500, null));
    }
  });

}

export const getAllEventNames = async (req: any, res: any) => {
  return withClient(async (client: any) => {
    try {
      // Fetch event names from both tables
      const smsQuery = `SELECT event_name FROM sms_config WHERE event_name IS NOT NULL AND template_id IS NOT NULL`;
      const waQuery = `SELECT event_name FROM whatsapp_config WHERE event_name IS NOT NULL`;

      const [smsResult, waResult] = await Promise.all([
        client.query(smsQuery),
        client.query(waQuery),
      ]);

      // Combine and remove duplicates
      const smsEvents = smsResult.rows.map((r: any) => r.event_name.trim());
      const waEvents = waResult.rows.map((r: any) => r.event_name.trim());

      const uniqueEvents = [...new Set([...smsEvents, ...waEvents])].sort();

      return res.status(200).send(generateResponse(true, "Fetched event names successfully", 200, uniqueEvents));

    } catch (error: any) {
      console.error("Error fetching event names:", error);
      return res.status(500).json({
        status: false,
        message: "Internal server error",
        code: 500,
        error: error.message,
      });
    }
  });
};