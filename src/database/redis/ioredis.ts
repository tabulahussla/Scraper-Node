import config from "config";
import Redis from "ioredis";

export default new Redis(config.get("redis"));
