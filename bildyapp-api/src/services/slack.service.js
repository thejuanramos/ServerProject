import axios from 'axios';

export const sendSlackNotification = async (error, req) => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('Slack Webhook URL not configured. Skipping notification.');
    return;
  }

  const message = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🚨 Server Error (500) detected",
          emoji: true
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Method:*\n${req.method}`
          },
          {
            type: "mrkdwn",
            text: `*Path:*\n${req.originalUrl}`
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Error Message:*\n\`${error.message}\``
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Stack Trace:*\n\`\`\`${error.stack.split('\n').slice(0, 3).join('\n')}\`\`\``
        }
      }
    ]
  };

  try {
    await axios.post(webhookUrl, message);
  } catch (err) {
    console.error('Failed to send Slack notification:', err.message);
  }
};