import { generateText, streamText } from "ai";
import { google } from "@ai-sdk/google";

export default defineLazyEventHandler(async () => {
    const model = google("gemini-2.5-flash-preview-04-17");

    return defineEventHandler(async (event: any) => {
        console.log("Received event:", event.context.session);
        const { messages } = await readBody(event);
        console.log("Received messages:", messages);

        const result = streamText({
            model,
            messages,
        });
        return result.toDataStreamResponse();
    });
});
