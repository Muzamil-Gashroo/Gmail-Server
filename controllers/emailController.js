const axios = require("axios");
const User = require("../models/user");
const SentEmail = require("../models/sentEmail");
const { config } = require("../config/config");
const { parseEmailBody } = require("../utils/emailParser");

const emailController = {
  getEmails: async (req, res) => {
    try {
      const userEmail = req.params.userEmail;
      const maxResults = parseInt(req.query.maxResults) || 10;
      const pageToken = req.query.pageToken || null;

      console.log(`Fetching emails for: ${userEmail}`);

      const user = await User.findOne({ email: userEmail });

      if (!user) {
        console.error("User not found in database");
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.accessToken) {
        console.error("User has no access token");
        return res.status(401).json({ error: "User not authenticated. Please authenticate first at /auth/google" });
      }

      let gmailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`;
      if (pageToken) {
        gmailUrl += `&pageToken=${pageToken}`;
      }

      console.log("Requesting Gmail API for message list...");
      const messagesResponse = await axios.get(gmailUrl, {
        headers: {
          Authorization: `Bearer ${user.accessToken}`
        }
      });

      const messageIds = messagesResponse.data.messages || [];
      console.log(`Found ${messageIds.length} messages. Fetching full details...`);

      const emailPromises = messageIds.map(msg =>
        axios.get(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          {
            headers: {
              Authorization: `Bearer ${user.accessToken}`
            }
          }
        )
      );

      const emailResponses = await Promise.all(emailPromises);

      const emails = emailResponses.map(response => {
        const message = response.data;

        const headers = {};
        if (message.payload.headers) {
          message.payload.headers.forEach(header => {
            headers[header.name.toLowerCase()] = header.value;
          });
        }

        const body = parseEmailBody(message.payload);

        return {
          id: message.id,
          threadId: message.threadId,
          labelIds: message.labelIds,
          snippet: message.snippet,
          subject: headers.subject || '(No Subject)',
          from: headers.from || 'Unknown',
          to: headers.to || '',
          date: headers.date || '',
          body: body,
          internalDate: message.internalDate
        };
      });

      console.log(`Successfully fetched and parsed ${emails.length} emails with full content`);

      res.json({
        emails: emails,
        nextPageToken: messagesResponse.data.nextPageToken,
        resultSizeEstimate: messagesResponse.data.resultSizeEstimate,
        count: emails.length
      });

    } catch (err) {
      console.error("Error fetching emails:", err.response?.data || err.message);
      res.status(500).json({
        error: "Failed to fetch emails",
        details: err.response?.data?.error || err.message
      });
    }
  },

  sendEmail: async (req, res) => {
    try {
      const userEmail = req.params.userEmail;
      const { to, subject, body, trackRead } = req.body;

      if (!to || !subject || !body) {
        return res.status(400).json({
          error: "Missing required fields. Need: to, subject, body"
        });
      }

      console.log(`Sending email from: ${userEmail}`);

      const user = await User.findOne({ email: userEmail });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.accessToken) {
        return res.status(401).json({
          error: "User not authenticated. Please authenticate first at /auth/google"
        });
      }

      
      const trackingId = trackRead ? `${Date.now()}-${Math.random().toString(36).substring(7)}` : null;

      let emailBody = body.replace(/\n/g, '<br>');
      if (trackingId) {
        const trackingUrl = `${config.TRACKING_BASE_URL}/api/track/${trackingId}`;
        emailBody += `<img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="" />`;
        console.log(`Tracking URL embedded: ${trackingUrl}`);
      }

      const emailLines = [
        `To: ${to}`,
        `From: ${userEmail}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        emailBody
      ];

      const email = emailLines.join('\r\n');

      const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      console.log("Sending email via Gmail API...");

      const response = await axios.post(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        { raw: encodedEmail },
        {
          headers: {
            'Authorization': `Bearer ${user.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Email sent successfully:", response.data.id);

      if (trackingId) {
        const sentEmail = await SentEmail.create({
          trackingId,
          messageId: response.data.id,
          from: userEmail,
          to,
          subject,
        });
        console.log(`Tracking record created: ${trackingId}`);
        console.log(`Check tracking at: ${config.TRACKING_BASE_URL}/api/track/${trackingId}`);
      }

      res.json({
        success: true,
        messageId: response.data.id,
        threadId: response.data.threadId,
        trackingId: trackingId,
        trackingUrl: trackingId ? `${config.TRACKING_BASE_URL}/api/track/${trackingId}` : null,
        message: "Email sent successfully",
        debug: {
          trackingEnabled: !!trackingId,
          baseUrl: config.TRACKING_BASE_URL,
          emailBodyPreview: emailBody.substring(emailBody.length - 200) 
        }
      });

    } catch (err) {
      console.error("Error sending email:", err.response?.data || err.message);
      res.status(500).json({
        error: "Failed to send email",
        details: err.response?.data?.error || err.message
      });
    }
  },

  getSentEmails: async (req, res) => {
    try {
      const userEmail = req.params.userEmail;

      console.log(`Fetching sent emails for: ${userEmail}`);

      const sentEmails = await SentEmail.find({ from: userEmail })
        .sort({ sentAt: -1 })
        .limit(50);

      console.log(`Found ${sentEmails.length} sent emails with tracking`);

      res.json({
        success: true,
        emails: sentEmails.map(email => ({
          messageId: email.messageId,
          to: email.to,
          subject: email.subject,
          sentAt: email.sentAt,
          opened: email.opened,
          openedAt: email.openedAt,
          trackingId: email.trackingId
        }))
      });
    } catch (err) {
      console.error("Error fetching sent emails:", err.message);
      res.status(500).json({
        error: "Failed to fetch sent emails",
        details: err.message
      });
    }
  }
};

module.exports = emailController;