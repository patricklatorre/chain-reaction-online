import io from "socket.io-client";
import endpoints from './endpoints';

const ioClient = io(endpoints.server);

export default ioClient;