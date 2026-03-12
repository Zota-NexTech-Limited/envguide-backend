import { withClient } from '../util/database';
import { ulid } from 'ulid';


///******************Email******************************************* */

interface NotificationCommunicationItems {
  is_email?: boolean;
  type: string;
  is_sms?: boolean;
  is_push_notification?: boolean;
  is_whatsapp?: boolean;
  template_name: string;
  sms_config_id: string;
  whatsapp_config_id: string;
  notification_config_id: string;
  template_id: string
  subject: string;
  body: string;
  attachments: string;
  transaction_status: boolean;
  review_required?: boolean;
  notification_count?: boolean;
}

interface NotificationRecipientItems {
  is_email?: boolean;
  type: string;
  is_sms?: boolean;
  is_push_notification?: boolean;
  is_whatsapp?: boolean;
  recipient_group: string[];
  recipient_users: string[];
  specific_users: string[];
}

export async function addNotificationDetails(
  notificationData: any,
  notificationCommunicationData: NotificationCommunicationItems[],
  notificationRecipentsData: NotificationRecipientItems[]
) {
  return withClient(async (client: any) => {

    try {
      await client.query("BEGIN");

      const ntf_id = ulid();

      const notificationInsert = {
        ntf_id,
        notification_code: "",
        alert_name: notificationData.alert_name,
        event_type: notificationData.event_type,
        priority: notificationData.priority,
        condition_type: notificationData.condition_type,
        transaction_type: notificationData.transaction_type,
        table_names: notificationData.table_names,
        column_condition: notificationData.column_condition,
        frequency: notificationData.frequency,
        frequency_accurrence: notificationData.frequency_accurrence,
        frequency_time_gap: notificationData.frequency_time_gap,
        frequency_first_alert: notificationData.frequency_first_alert,
        is_email: notificationData.is_email,
        is_sms: notificationData.is_sms,
        is_push_notification: notificationData.is_push_notification,
        is_whatsapp: notificationData.is_whatsapp,
        sql_query: notificationData.sql_query,
        status: notificationData.status ?? "Active",
        created_by: notificationData.created_by,
        start_or_stop: true
      };

      const auditNumberPrefix = "NTF";
      const latestQuery = `SELECT notification_code FROM notification WHERE notification_code IS NOT NULL ORDER BY created_date DESC LIMIT 1`;
      const latestResult = await client.query(latestQuery);

      let nextNumber = 1;
      if (latestResult.rows.length > 0) {
        const latestCode = latestResult.rows[0].notification_code;
        const numberPart = parseInt(latestCode.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(numberPart)) nextNumber = numberPart + 1;
      }

      notificationInsert.notification_code = String(nextNumber).padStart(4, "0") + auditNumberPrefix;

      const notifColumns = Object.keys(notificationInsert);
      const notifValues = Object.values(notificationInsert);
      const notifPlaceholders = notifColumns.map((_, i) => `$${i + 1}`).join(", ");

      const insertNotifQuery = `INSERT INTO notification (${notifColumns.join(", ")}) VALUES (${notifPlaceholders}) RETURNING *`;
      const notifResult = await client.query(insertNotifQuery, notifValues);
      const insertedNotification = notifResult.rows[0];

      const insertedCommunicationChannels: any = [];
      const insertedRecipients: any = [];

      const commTypes = ["is_email", "is_sms", "is_whatsapp", "is_push_notification"];

      for (const type of commTypes) {
        const ntfcc_id = ulid();

        const typeMap: any = {
          is_email: "email",
          is_sms: "sms",
          is_whatsapp: "whatsapp",
          is_push_notification: "notification"
        };

        // ✅ Match communication by type name for correct config IDs
        const commItem = notificationCommunicationData.find(
          (comm: NotificationCommunicationItems) => comm.type === typeMap[type]
        );

        // fallback if not found: use an empty object to preserve 4 insertions
        const commData: any = commItem || {};

        const commInsert = {
          ntfcc_id,
          ntf_id,
          type: typeMap[type],
          is_email: type === "is_email" ? commData.is_email ?? false : false,
          is_whatsapp: type === "is_whatsapp" ? commData.is_whatsapp ?? false : false,
          is_push_notification: type === "is_push_notification" ? commData.is_push_notification ?? false : false,
          is_sms: type === "is_sms" ? commData.is_sms ?? false : false,
          template_name: commData.template_name ?? null,
          template_id: commData.template_id ?? null,
          sms_config_id: commData.sms_config_id ?? null,
          whatsapp_config_id: commData.whatsapp_config_id ?? null,
          notification_config_id: commData.notification_config_id ?? null,
          subject: commData.subject ?? null,
          body: commData.body ?? null,
          attachments: commData.attachments ?? null,
          transaction_status: commData.transaction_status ?? false,
          created_by: notificationInsert.created_by
        };

        const commColumns = Object.keys(commInsert);
        const commValues = Object.values(commInsert);
        const commPlaceholders = commColumns.map((_, i) => `$${i + 1}`).join(", ");

        const insertCommQuery = `INSERT INTO notification_communication_channel (${commColumns.join(", ")}) VALUES (${commPlaceholders}) RETURNING *`;
        const commResult = await client.query(insertCommQuery, commValues);
        insertedCommunicationChannels.push(commResult.rows[0]);

        // ✅ Match recipient by type for config alignment, but still insert 4 rows
        const matchedRecipient = notificationRecipentsData.find(
          (rec: NotificationRecipientItems) => rec.type === typeMap[type]
        );
        const recData: any = matchedRecipient || {};

        const recipientInsert = {
          ntfr_id: ulid(),
          ntf_id,
          ntfcc_id,
          type: typeMap[type],
          recipient_group: recData.recipient_group ?? [],
          recipient_users: recData.recipient_users ?? [],
          specific_users: recData.specific_users ?? [],
          is_email: type === "is_email" ? recData.is_email ?? false : false,
          is_whatsapp: type === "is_whatsapp" ? recData.is_whatsapp ?? false : false,
          is_push_notification: type === "is_push_notification" ? recData.is_push_notification ?? false : false,
          is_sms: type === "is_sms" ? recData.is_sms ?? false : false,
          created_by: notificationInsert.created_by
        };

        const recipColumns = Object.keys(recipientInsert);
        const recipValues = Object.values(recipientInsert);
        const recipPlaceholders = recipColumns.map((_, i) => `$${i + 1}`).join(", ");

        const insertRecipQuery = `INSERT INTO notification_recipient (${recipColumns.join(", ")}) VALUES (${recipPlaceholders}) RETURNING *`;
        const recipResult = await client.query(insertRecipQuery, recipValues);
        insertedRecipients.push(recipResult.rows[0]);
      }


      await client.query("COMMIT");
      return {
        notificationData: insertedNotification,
        notificationCommunicationData: insertedCommunicationChannels,
        notificationRecipientsData: insertedRecipients
      };

    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error inserting notification:", error);
      throw error;
    }
  });

}


// Interfaces for type safety
interface NotificationCommunicationItem {
  ntfcc_id?: string;
  type: string;
  template_name: string;
  template_id: string;
  sms_config_id: string;
  whatsapp_config_id: string;
  notification_config_id: string;
  subject: Text;
  body: Text;
  is_email: boolean;
  is_whatsapp: boolean;
  is_push_notification: boolean;
  is_sms: boolean;
  transaction_status: boolean;
  attachments: Text;
  updated_by: string;
}

interface NotificationRecipientItem {
  ntfr_id?: string;
  type: string;
  ntfcc_id: string;
  is_email: boolean;
  is_whatsapp: boolean;
  is_push_notification: boolean;
  is_sms: boolean;
  specific_users: any;
  recipient_group: any;
  recipient_users: any;
  updated_by: string;
}


export async function updateNotificationDetails(
  notificationData: any,
  notificationCommunicationData: NotificationCommunicationItem[],
  notificationRecipentsData: NotificationRecipientItem[]
) {
  return withClient(async (client: any) => {
    try {
      await client.query('BEGIN');

      const ntf_id = notificationData.ntf_id;

      // 1️⃣ Update notification table
      const notificationUpdate = {
        alert_name: notificationData.alert_name,
        priority: notificationData.priority,
        event_type: notificationData.event_type,
        condition_type: notificationData.condition_type,
        transaction_type: notificationData.transaction_type,
        table_names: notificationData.table_names,
        column_condition: notificationData.column_condition,
        frequency: notificationData.frequency,
        frequency_accurrence: notificationData.frequency_accurrence,
        frequency_time_gap: notificationData.frequency_time_gap,
        frequency_first_alert: notificationData.frequency_first_alert,
        is_email: notificationData.is_email,
        is_sms: notificationData.is_sms,
        is_push_notification: notificationData.is_push_notification,
        is_whatsapp: notificationData.is_whatsapp,
        sql_query: notificationData.sql_query,
        status: notificationData.status ?? 'Active',
        updated_by: notificationData.updated_by,
        start_or_stop: true
      };

      const notifCols = Object.keys(notificationUpdate);
      const notifVals = Object.values(notificationUpdate);
      const notifSetClause = notifCols.map((col, i) => `${col} = $${i + 1}`).join(', ');
      const updateNotifQuery = `UPDATE notification SET ${notifSetClause} WHERE ntf_id = $${notifCols.length + 1} RETURNING *`;
      const notifResult = await client.query(updateNotifQuery, [...notifVals, ntf_id]);
      const updatedNotification = notifResult.rows[0];

      // 2️⃣ Update Communication Channels
      const updatedCommunicationChannels: any = [];
      const updatedRecipients: any = [];

      for (const commItem of notificationCommunicationData) {
        const commUpdate = {
          type: commItem.type,
          is_email: commItem.is_email ?? false,
          is_whatsapp: commItem.is_whatsapp ?? false,
          is_push_notification: commItem.is_push_notification ?? false,
          is_sms: commItem.is_sms ?? false,
          template_name: commItem.template_name ?? null,
          template_id: commItem.template_id ?? null,
          sms_config_id: commItem.sms_config_id ?? null,
          whatsapp_config_id: commItem.whatsapp_config_id ?? null,
          notification_config_id: commItem.notification_config_id ?? null,
          attachments: commItem.attachments ?? null,
          subject: commItem.subject ?? null,
          body: commItem.body ?? null,
          transaction_status: commItem.transaction_status ?? false,
          updated_by: commItem.updated_by
        };

        const commCols = Object.keys(commUpdate);
        const commVals = Object.values(commUpdate);
        const commSetClause = commCols.map((col, i) => `${col} = $${i + 1}`).join(', ');
        const updateCommQuery = `UPDATE notification_communication_channel SET ${commSetClause} WHERE ntfcc_id = $${commCols.length + 1} RETURNING *`;
        const commUpdateResult = await client.query(updateCommQuery, [...commVals, commItem.ntfcc_id]);
        updatedCommunicationChannels.push(commUpdateResult.rows[0]);

        // 3️⃣ Update Recipients linked to this communication
        const commSpecificRecipients = notificationRecipentsData.filter(
          (r: NotificationRecipientItem) => r.ntfcc_id === commItem.ntfcc_id
        );

        for (const recipItem of commSpecificRecipients) {
          const recipUpdate = {
            type: commItem.type,
            recipient_group: recipItem.recipient_group ?? [],
            recipient_users: recipItem.recipient_users ?? [],
            specific_users: recipItem.specific_users ?? [],
            is_email: commItem.is_email ?? false,
            is_whatsapp: commItem.is_whatsapp ?? false,
            is_push_notification: commItem.is_push_notification ?? false,
            is_sms: commItem.is_sms ?? false,
            updated_by: recipItem.updated_by
          };

          const recipCols = Object.keys(recipUpdate);
          const recipVals = Object.values(recipUpdate);
          const recipSetClause = recipCols.map((col, i) => `${col} = $${i + 1}`).join(', ');
          const updateRecipQuery = `UPDATE notification_recipient SET ${recipSetClause} WHERE ntfr_id = $${recipCols.length + 1} RETURNING *`;
          const recipUpdateResult = await client.query(updateRecipQuery, [...recipVals, recipItem.ntfr_id]);
          updatedRecipients.push(recipUpdateResult.rows[0]);
        }
      }

      await client.query('COMMIT');


      return {
        updatedNotification,
        updatedCommunicationChannels: updatedCommunicationChannels,
        updatedRecipients: updatedRecipients
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error("Error updating notification:", error);
      throw error;
    }
  });
}


export async function getNotificationLists(
  searchColumn?: string,
  searchValue?: string,
  sortBy?: string,
  sortOrder?: string,
  page_no?: number,
  from_date?: string,
  to_date?: string,
  statusFilter?: string,
  channel_values?: string[]
) {
  return withClient(async (client: any) => {
    try {
      const limit = 20;
      const pageNumber = page_no && page_no > 0 ? parseInt(page_no.toString()) : 1;
      const offset = (pageNumber - 1) * limit;

      const values: any[] = [];
      const conditions: string[] = [];

      let query = `
      SELECT 
        notification.ntf_id,
        notification.notification_code,
        notification.alert_name,
        notification.priority,
        notification.condition_type,
        notification.transaction_type,
        notification.column_condition,
        notification.frequency_accurrence,
        notification.frequency_time_gap,
        notification.frequency_first_alert,
        notification.is_email, 
        notification.is_sms,
        notification.is_push_notification,
        notification.is_whatsapp,
        notification.frequency,
        notification.status,
        notification.start_or_stop,
        notification.created_date,
        notification.update_date,
        utc.user_name AS created_by_name,
        utu.user_name AS updated_by_name,
        (
          SELECT MAX(th.created_date)
          FROM notification_triggered_history th
          WHERE th.ntf_id = notification.ntf_id
        ) AS last_run_date
      FROM notification
      LEFT JOIN users_table utc ON utc.user_id = notification.created_by
      LEFT JOIN users_table utu ON utu.user_id = notification.updated_by
    `;

      const allowedSearchColumns = [
        "notification_code",
        "alert_name",
        "priority",
        "condition_type",
        "transaction_type",
        "status",
        "column_condition",
        "column_value",
        "frequency_accurrence",
        "frequency_time_gap",
        "frequency_first_alert",
      ];

      // Search filter
      if (searchColumn && searchValue) {
        if (!allowedSearchColumns.includes(searchColumn)) {
          throw new Error(`Invalid search column: ${searchColumn}`);
        }
        values.push(`%${searchValue}%`);
        conditions.push(`notification.${searchColumn} ILIKE $${values.length}`);
      }

      // Status filter
      if (statusFilter) {
        values.push(`%${statusFilter}%`);
        conditions.push(`notification.status ILIKE $${values.length}`);
      }

      // Date filters
      if (from_date && to_date) {
        values.push(`${from_date} 00:00:00`);
        values.push(`${to_date} 23:59:59.999`);
        conditions.push(`notification.created_date BETWEEN $${values.length - 1} AND $${values.length}`);
      } else if (from_date) {
        values.push(`${from_date} 00:00:00`);
        conditions.push(`notification.created_date >= $${values.length}`);
      } else if (to_date) {
        values.push(`${to_date} 23:59:59.999`);
        conditions.push(`notification.created_date <= $${values.length}`);
      }

      // Ensure channel_values is an array if provided
      if (typeof channel_values === "string") {
        try {
          channel_values = JSON.parse(channel_values);
        } catch (e) {
          throw new Error(`Invalid channel_values: Must be a JSON array`);
        }
      }


      // Channel filters
      if (channel_values && channel_values.length > 0) {
        const channelConditions = channel_values.map((channel) => {
          if (
            ["is_email", "is_sms", "is_push_notification", "is_whatsapp"].includes(channel)
          ) {
            return `notification.${channel} = true`;
          } else {
            throw new Error(`Invalid channel filter: ${channel}`);
          }
        });
        if (channelConditions.length > 0) {
          conditions.push(`(${channelConditions.join(" OR ")})`);
        }
      }

      // Apply conditions
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
      }

      // Sorting
      let sortColumn = "alert_name";
      let sortDirection = "ASC";

      const allowedSortColumns = [
        "notification_code",
        "alert_name",
        "priority",
        "condition_type",
        "transaction_type",
        "frequency",
        "frequency_accurrence",
        "frequency_time_gap",
        "frequency_first_alert",
        "status",
      ];

      if (sortBy && allowedSortColumns.includes(sortBy)) {
        sortColumn = sortBy;
      }

      if (sortOrder && ["ASC", "DESC"].includes(sortOrder.toUpperCase())) {
        sortDirection = sortOrder.toUpperCase();
      }

      query += ` ORDER BY notification.${sortColumn} ${sortDirection} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
      values.push(limit);
      values.push(offset);

      // Query the data
      const result = await client.query(query, values);

      // Count query for pagination
      let countQuery = `SELECT COUNT(*) AS total_count FROM notification`;
      if (conditions.length > 0) {
        countQuery += ` WHERE ${conditions.join(" AND ")}`;
      }
      const countResult = await client.query(countQuery, values.slice(0, values.length - 2));
      const totalCount = parseInt(countResult.rows[0]?.total_count || "0");
      const totalPages = Math.ceil(totalCount / limit);

      // Stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM notification_triggered_history WHERE status = 'Success') AS all_time_triggered_count,
        (SELECT COUNT(*) FROM notification_triggered_history WHERE status = 'Success' AND created_date >= $1) AS today_triggered_count,
        (SELECT COUNT(*) FROM notification_triggered_history WHERE status = 'Failed') AS all_time_failed_count,
        (SELECT COUNT(*) FROM notification_triggered_history WHERE status = 'Failed' AND created_date >= $1) AS today_failed_count,
        (SELECT COUNT(*) FROM notification WHERE status = 'Active') AS active_alerts_count,
        (SELECT COUNT(*) FROM notification WHERE status = 'Paused') AS pushed_count,
        (SELECT COUNT(*) FROM notification WHERE priority = 'High') AS high_priority_count,
        (SELECT COUNT(*) FROM notification WHERE priority = 'Medium') AS medium_priority_count,
        (SELECT COUNT(*) FROM notification WHERE priority = 'Low') AS low_priority_count
    `;
      const statsResult = await client.query(statsQuery, [todayISO]);
      const stats = statsResult.rows[0];

      return {
        notifications: result.rows,
        pagination: {
          total_items: totalCount,
          total_pages: totalPages,
          current_page: pageNumber,
          page_size: limit,
          has_next: pageNumber < totalPages,
          has_previous: pageNumber > 1,
        },
        stats: {
          all_time_triggered_count: parseInt(stats.all_time_triggered_count || "0"),
          today_triggered_count: parseInt(stats.today_triggered_count || "0"),
          all_time_failed_count: parseInt(stats.all_time_failed_count || "0"),
          today_failed_count: parseInt(stats.today_failed_count || "0"),
          active_alerts_count: parseInt(stats.active_alerts_count || "0"),
          pushed_count: parseInt(stats.pushed_count || "0"),
          high_priority_count: parseInt(stats.high_priority_count || "0"),
          medium_priority_count: parseInt(stats.medium_priority_count || "0"),
          low_priority_count: parseInt(stats.low_priority_count || "0"),
        },
      };
    } catch (error: any) {
      console.error("Error in getNotificationLists:", error);
      throw new Error(`Database error: ${error.message}`);
    }
  });

}


export async function getNotificationListByIds(ntf_id: string) {
  return withClient(async (client: any) => {
    try {
      if (!ntf_id) {
        throw new Error("ntf_id is required");
      }

      const notificationQuery = `
      SELECT 
        n.ntf_id,
        n.notification_code,
        n.alert_name,
        n.event_type,
        n.priority,
        n.condition_type,
        n.transaction_type,
        n.table_names,
        n.column_condition,
        n.frequency,
        n.frequency_accurrence,
        n.frequency_time_gap,
        n.frequency_first_alert,
        n.is_email, 
        n.is_sms,
        n.is_push_notification,
        n.is_whatsapp,
        n.sql_query,
        n.status,
        n.start_or_stop,
        n.created_by,
        n.updated_by,
        n.created_date,
        n.update_date,
        cu.user_name AS created_by_name,
        uu.user_name AS updated_by_name,
        (
          SELECT MAX(th.created_date)
          FROM notification_triggered_history th
          WHERE th.ntf_id = n.ntf_id
        ) AS last_run_date
      FROM notification n
      LEFT JOIN users_table cu ON cu.user_id = n.created_by
      LEFT JOIN users_table uu ON uu.user_id = n.updated_by
      WHERE n.ntf_id = $1
    `;
      const notificationResult = await client.query(notificationQuery, [ntf_id]);

      if (notificationResult.rows.length === 0) {
        return null; // no record found
      }

      const notificationData = notificationResult.rows[0];

      const communicationQuery = `
      SELECT 
        c.ntfcc_id,
        c.ntf_id,
        c.template_name,
        c.subject,
        c.body,
        c.attachments,
        c.is_email,
        c.is_sms,
        c.is_push_notification,
        c.is_whatsapp,
        c.transaction_status,
         c.attachments,
        c.created_by,
        c.updated_by,
        c.created_date,
        c.update_date,
        c.type,
        cu.user_name AS created_by_name,
        uu.user_name AS updated_by_name,
        sc.template_id AS sms_template_id,
        sc.event_name AS sms_event_name,
        wc.template_name AS whatsapp_template_name,
        nc.event_name AS notification_event_name
      FROM notification_communication_channel c
      LEFT JOIN users_table cu ON cu.user_id = c.created_by
      LEFT JOIN users_table uu ON uu.user_id = c.updated_by
      LEFT JOIN sms_config sc ON sc.id = c.sms_config_id
      LEFT JOIN whatsapp_config wc ON wc.id = c.whatsapp_config_id
      LEFT JOIN notification_config nc ON nc.id = c.notification_config_id
      WHERE c.ntf_id = $1
    `;
      const communicationResult = await client.query(communicationQuery, [ntf_id]);
      const notificationCommunicationData = communicationResult.rows;


      const ntfccIds = notificationCommunicationData.map((row: any) => row.ntfcc_id);

      let notificationRecipientsData: any[] = [];
      if (ntfccIds.length > 0) {
        const recipientQuery = `
        SELECT 
          r.ntfr_id,
          r.ntf_id,
          r.ntfcc_id,
          r.recipient_group,
          r.recipient_users,
          r.specific_users,
          r.created_by,
          r.updated_by,
          r.created_date,
          r.update_date,
          r.is_email,
          r.is_sms,
          r.is_push_notification,
          r.is_whatsapp,
             r.type,
          cu.user_name AS created_by_name,
          uu.user_name AS updated_by_name
        FROM notification_recipient r
        LEFT JOIN users_table cu ON cu.user_id = r.created_by
        LEFT JOIN users_table uu ON uu.user_id = r.updated_by
        WHERE r.ntf_id = $1 AND r.ntfcc_id = ANY($2)
      `;
        const recipientResult = await client.query(recipientQuery, [ntf_id, ntfccIds]);
        notificationRecipientsData = recipientResult.rows;

      }

      const formattedCommunicationData: any[] = [];

      for (const item of notificationCommunicationData) {
        let sms_template_data = null;
        let whatsapp_template_data = null;
        if (item.sms_template_id && item.type === "sms" && item.is_sms) {
          // sms_template_data = await fetchSmsTemplate(item.sms_template_id);
        }

        if (item.whatsapp_template_name && item.type === "whatsapp" && item.is_whatsapp) {
          // whatsapp_template_data = await fetchWhatsAppTemplates(item.whatsapp_template_name);
        }
        // console.log(sms_template_data, "sms_template_datasms_template_data", item.sms_template_id);

        const obj: any = {
          ntfcc_id: item.ntfcc_id,
          ntf_id: item.ntf_id,
          type: item.type,
          template_name: item.template_name || "",
          subject: item.subject || "",
          body: item.body || "",
          attachments: item.attachments || "",
          transaction_status: item.transaction_status || false,
          review_required: false,
          notification_count: true,
          created_by: item.created_by,
          updated_by: item.updated_by,
          created_date: item.created_date,
          update_date: item.update_date,
          created_by_name: item.created_by_name,
          updated_by_name: item.updated_by_name,
          sms_template_id: item.sms_template_id,
          sms_event_name: item.sms_event_name,
          whatsapp_template_name: item.whatsapp_template_name,
          notification_event_name: item.notification_event_name,
          sms_template_data: sms_template_data || null,
          whatsapp_template_data: whatsapp_template_data || null
        };

        // ✅ Add only the relevant flag
        if (item.type === "email") obj.is_email = item.is_email;
        else if (item.type === "sms") obj.is_sms = item.is_sms;
        else if (item.type === "whatsapp") obj.is_whatsapp = item.is_whatsapp;
        else if (item.type === "notification") obj.is_push_notification = item.is_push_notification;

        formattedCommunicationData.push(obj);
      }


      const formattedRecipientsData = notificationRecipientsData.map(item => {
        const type = item.type

        const obj: any = {
          ntfr_id: item.ntfr_id,
          ntfcc_id: item.ntfcc_id,
          ntf_id: item.ntf_id,
          type: type,
          specific_users: item.specific_users || [],
          recipient_group: item.recipient_group || [],
          recipient_users: item.recipient_users || [],
          created_by: item.created_by,
          updated_by: item.updated_by,
          created_date: item.created_date,
          update_date: item.update_date,
          created_by_name: item.created_by_name,
          updated_by_name: item.updated_by_name
        };

        // ✅ Add only the relevant flag
        if (type === "email") obj.is_email = item.is_email;
        else if (type === "sms") obj.is_sms = item.is_sms;
        else if (type === "whatsapp") obj.is_whatsapp = item.is_whatsapp;
        else if (type === "notification") obj.is_push_notification = item.is_push_notification;

        return obj;
      });

      return {
        notificationData,
        notificationCommunicationData: formattedCommunicationData,
        notificationRecipientsData: formattedRecipientsData
      };

    } catch (error: any) {
      console.error("Error in getNotificationListByIds:", error);
      throw new Error(`Database error: ${error.message}`);
    }
  });

}


export async function getAllAlertsLists(
  search?: string,
  page_no?: number
) {
  return withClient(async (client: any) => {

    try {
      const limit = 20;
      const pageNumber = page_no && page_no > 0 ? parseInt(page_no.toString()) : 1;
      const offset = (pageNumber - 1) * limit;

      const values: any[] = [];
      const conditions: string[] = [];

      let query = `
      SELECT 
        n.ntf_id,
        n.notification_code,
        n.alert_name,
        n.priority,
        n.condition_type,
        n.transaction_type,
        n.column_condition,
        n.frequency_accurrence,
        n.frequency_time_gap,
        n.frequency_first_alert,
        n.is_email, 
        n.is_sms,
        n.is_push_notification,
        n.is_whatsapp,
        n.frequency,
        n.status,
        n.created_date,
        (
          SELECT MAX(th.created_date)
          FROM notification_triggered_history th
          WHERE th.ntf_id = n.ntf_id
        ) AS last_run_date
      FROM notification n
    `;

      if (search) {
        values.push(`%${search}%`);
        conditions.push(`(
        n.notification_code ILIKE $${values.length} OR
        n.alert_name ILIKE $${values.length} OR
        n.transaction_type ILIKE $${values.length}
      )`);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ` ORDER BY n.created_date DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
      values.push(limit);
      values.push(offset);

      const result = await client.query(query, values);

      // Count total notifications for pagination
      let countQuery = `SELECT COUNT(*) AS total_count FROM notification n`;
      if (conditions.length > 0) {
        countQuery += ` WHERE ${conditions.join(' AND ')}`;
      }
      const countResult = await client.query(countQuery, values.slice(0, values.length - 2));
      const totalCount = parseInt(countResult.rows[0]?.total_count || '0');
      const totalPages = Math.ceil(totalCount / limit);

      // Stats query
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const todayISO = startOfDay.toISOString();

      const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM notification_triggered_history WHERE status = 'Success') AS all_time_triggered_count,
        (SELECT COUNT(*) FROM notification_triggered_history WHERE status = 'Success' AND created_date >= $1) AS today_triggered_count,
        (SELECT COUNT(*) FROM notification_triggered_history WHERE status = 'Failed') AS all_time_failed_count,
        (SELECT COUNT(*) FROM notification_triggered_history WHERE status = 'Failed' AND created_date >= $1) AS today_failed_count,
        (SELECT COUNT(*) FROM notification WHERE status = 'Active') AS active_alerts_count,
        (SELECT COUNT(*) FROM notification WHERE status = 'Inactive') AS inactive_alerts_count
    `;
      const statsResult = await client.query(statsQuery, [todayISO]);
      const stats = statsResult.rows[0];

      return {
        notifications: result.rows,
        pagination: {
          total_items: totalCount,
          total_pages: totalPages,
          current_page: pageNumber,
          page_size: limit,
          has_next: pageNumber < totalPages,
          has_previous: pageNumber > 1
        },
        stats: {
          all_time_triggered_count: parseInt(stats.all_time_triggered_count || '0'),
          today_triggered_count: parseInt(stats.today_triggered_count || '0'),
          all_time_failed_count: parseInt(stats.all_time_failed_count || '0'),
          today_failed_count: parseInt(stats.today_failed_count || '0'),
          active_alerts_count: parseInt(stats.active_alerts_count || '0'),
          inactive_alerts_count: parseInt(stats.inactive_alerts_count || '0')
        }
      };
    } catch (error: any) {
      console.error("Error in getAllAlertsLists:", error);
      throw new Error(`Database error: ${error.message}`);
    }
  });

}




///******************whatsapp******************************************* */

