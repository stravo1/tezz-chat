import { handleAuthAPIRequest } from "supertokens-node/custom";
import { ensureSuperTokensInit } from "../../auth/config";

ensureSuperTokensInit();

export default defineEventHandler(async (event) => {
    try {
        const request = await convertToRequest(event);
        const response = await handleAuthAPIRequest()(request);
        return response;
    } catch (err) {
        console.log(err);
        event.node.res.statusCode = 500;
        event.node.res.end(JSON.stringify({ error: "Internal server error" }));
    }
});