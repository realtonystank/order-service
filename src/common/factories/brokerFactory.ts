import { KafkaBroker } from "../../config/kafka";
import { MessageBroker } from "../../types/broker";
import config from "config";

let broker: MessageBroker | null = null;

export const createMessageBroker = (): MessageBroker => {
  if (!broker) {
    broker = new KafkaBroker(config.get("service.name"), [
      config.get("kafka.broker"),
    ]);
  }

  return broker;
};
