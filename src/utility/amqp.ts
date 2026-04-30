import amqplib from "amqplib";

let connection: Awaited<ReturnType<typeof amqplib.connect>> | null = null;
let channel: Awaited<ReturnType<Awaited<ReturnType<typeof amqplib.connect>>["createChannel"]>> | null = null;

export async function connectAmqp(): Promise<void> {
  const url = process.env.AMQP_URL;
  if (!url) {
    console.warn("[AMQP] AMQP_URL not set — skipping connection");
    return;
  }

  const conn = await amqplib.connect(url);
  connection = conn;
  channel = await conn.createChannel();
  console.log("[AMQP] Connected successfully");

  conn.on("error", (err) => {
    console.error("[AMQP] Connection error:", err.message);
  });

  conn.on("close", () => {
    console.warn("[AMQP] Connection closed");
    channel = null;
    connection = null;
  });
}

export function getChannel() {
  if (!channel) {
    throw new Error("[AMQP] Channel not initialized — call connectAmqp() first");
  }
  return channel;
}

export async function publishToQueue(queue: string, message: object, priority: number = 0): Promise<boolean> {
  const ch = getChannel();
  await ch.assertQueue(queue, { durable: true, arguments: { "x-max-priority": 10 } });
  return ch.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
    persistent: true,
    priority,
  });
}
