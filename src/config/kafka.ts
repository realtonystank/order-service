import { Consumer, EachMessagePayload, Kafka, Producer } from "kafkajs";
import { MessageBroker } from "../types/broker";
import { handleProductUpdate } from "../productCache/productUpdateHandler";
import { handleToppingUpdate } from "../toppingCache/toppingUpdateHandler";

export class KafkaBroker implements MessageBroker {
  private consumer: Consumer;
  private producer: Producer;

  constructor(clientId: string, brokers: string[]) {
    const kafka = new Kafka({ clientId, brokers });
    this.consumer = kafka.consumer({ groupId: clientId });
    this.producer = kafka.producer();
  }

  async connectConsumer() {
    await this.consumer.connect();
  }
  async disconnectConsumer() {
    if (this.consumer) {
      await this.consumer.disconnect();
    }
  }
  async connectProducer() {
    await this.producer.connect();
  }
  async disconnectProducer() {
    if (this.producer) {
      await this.producer.disconnect();
    }
  }

  async consumeMessage(topics: string[], fromBeginning: boolean = false) {
    await this.consumer.subscribe({ topics, fromBeginning });
    await this.consumer.run({
      eachMessage: async ({
        topic,
        partition,
        message,
      }: EachMessagePayload) => {
        switch (topic) {
          case "product":
            await handleProductUpdate(message.value.toString());
            return;
          case "topping":
            await handleToppingUpdate(message.value.toString());
            return;
          default:
            console.log("Doing nothing...");
        }

        console.log({
          value: message.value.toString(),
          topic,
          partition,
        });
      },
    });
  }

  async sendMessage(topic: string, message: string, key: string) {
    const data: {
      value: string;
      key?: string;
    } = {
      value: message,
    };
    if (key) {
      data.key = key;
    }
    await this.producer.send({
      topic,
      messages: [data],
    });
  }
}
