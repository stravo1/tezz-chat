import { RelationMutate, RelationshipType } from "node-appwrite";
import { appwriteConfig, databases } from "./config";
import { COLLECTION_NAMES } from "./constant";

async function createUser() {
  await databases.createCollection(
    appwriteConfig.databaseId,
    COLLECTION_NAMES.USERS,
    "Users",
    ['read("any")'],
    false,
    false,
  );

  // Appwrite automatically provides $id as the primary key
  await databases.createEmailAttribute(
    appwriteConfig.databaseId,
    COLLECTION_NAMES.USERS,
    "email",
    true,
  );
  await databases.createStringAttribute(
    appwriteConfig.databaseId,
    COLLECTION_NAMES.USERS,
    "profilePicture",
    1024,
    false,
  );
  await databases.createStringAttribute(
    appwriteConfig.databaseId,
    COLLECTION_NAMES.USERS,
    "name",
    255,
    true,
  );
  await databases.createEnumAttribute(
    appwriteConfig.databaseId,
    COLLECTION_NAMES.USERS,
    "plan",
    ["FREE", "PREMIUM", "UNLIMITED"],
    true,
  );
  await databases.createDatetimeAttribute(
    appwriteConfig.databaseId,
    COLLECTION_NAMES.USERS,
    "createdAt",
    true
  );
  await databases.createDatetimeAttribute(
    appwriteConfig.databaseId,
    COLLECTION_NAMES.USERS,
    "updatedAt",
    true
  );
}

async function createChat() {
  await databases.createCollection(
    appwriteConfig.databaseId,
    COLLECTION_NAMES.CHATS,
    "Chats",
    ['read("any")'],
    false,
    false,
  );

  await databases.createStringAttribute(
    appwriteConfig.databaseId,
    COLLECTION_NAMES.CHATS,
    "title",
    255,
    true,
  );
  await databases.createEnumAttribute(
    appwriteConfig.databaseId,
    COLLECTION_NAMES.CHATS,
    "visibility",
    ["private", "public"],
    true,
  );
  // Offline sync attribute
  await databases.createBooleanAttribute(
    appwriteConfig.databaseId,
    COLLECTION_NAMES.CHATS,
    "deleted",
    false,
    false
  );
  await databases.createStringAttribute(
    appwriteConfig.databaseId,
    COLLECTION_NAMES.CHATS,
    "lastModifiedBy",
    255,
    true
  );
  await databases.createDatetimeAttribute(
    appwriteConfig.databaseId,
    COLLECTION_NAMES.CHATS,
    "createdAt",
    true
  );
  await databases.createDatetimeAttribute(
    appwriteConfig.databaseId,
    COLLECTION_NAMES.CHATS,
    "updatedAt",
    true
  );
}

async function createChatUserReference() {
  await databases.createRelationshipAttribute(
    appwriteConfig.databaseId,
    COLLECTION_NAMES.CHATS,
    COLLECTION_NAMES.USERS,
    RelationshipType.ManyToOne,
    true,
    "userId",
    "chatId",
    RelationMutate.Cascade,
  );
}

async function createChatMessage() {
    await databases.createCollection(
        appwriteConfig.databaseId,
        COLLECTION_NAMES.CHAT_MESSAGES,
        'ChatMessages',
        ['read("any")'],
        false,
        false,
    );

    await databases.createEnumAttribute(
        appwriteConfig.databaseId,
        COLLECTION_NAMES.CHAT_MESSAGES,
        'role',
        ['user', 'assistant', 'tool', 'system'],
        true
    );
    await databases.createStringAttribute(
        appwriteConfig.databaseId,
        COLLECTION_NAMES.CHAT_MESSAGES,
        'content',
        65535,
        true,
    );
    await databases.createStringAttribute(
        appwriteConfig.databaseId,
        COLLECTION_NAMES.CHAT_MESSAGES,
        'attachments',
        2000,
        false
    );
    // Offline sync attribute
    await databases.createBooleanAttribute(
        appwriteConfig.databaseId,
        COLLECTION_NAMES.CHAT_MESSAGES,
        "deleted",
        false,
        false
    );
    await databases.createStringAttribute(
        appwriteConfig.databaseId,
        COLLECTION_NAMES.CHAT_MESSAGES,
        "lastModifiedBy",
        255,
        true
    );
    await databases.createDatetimeAttribute(
        appwriteConfig.databaseId,
        COLLECTION_NAMES.CHAT_MESSAGES,
        'createdAt',
        true
    );
    await databases.createDatetimeAttribute(
        appwriteConfig.databaseId,
        COLLECTION_NAMES.CHAT_MESSAGES,
        'updatedAt',
        true
    );
}

async function ChatMessageChatReference(){
    await databases.createRelationshipAttribute(
        appwriteConfig.databaseId,
        COLLECTION_NAMES.CHAT_MESSAGES,
        COLLECTION_NAMES.CHATS,
        RelationshipType.ManyToOne,
        true,
        "chatId",
        "chatMessageId",
        RelationMutate.Cascade,
    )
}

async function createStream(){
    await databases.createCollection(
        appwriteConfig.databaseId,
        COLLECTION_NAMES.STREAMS,
        "Streams",
        ['read("any")'],
        false,
        false,
    )

    await databases.createDatetimeAttribute(
        appwriteConfig.databaseId,
        COLLECTION_NAMES.STREAMS,
        "createdAt",
        true
    )
    await databases.createDatetimeAttribute(
        appwriteConfig.databaseId,
        COLLECTION_NAMES.STREAMS,
        "updatedAt",
        true
    )
}

async function createStreamChatReference(){
    await databases.createRelationshipAttribute(
        appwriteConfig.databaseId,
        COLLECTION_NAMES.STREAMS,
        COLLECTION_NAMES.CHATS,
        RelationshipType.ManyToOne,
        true,
        "chatId",
        "streamId",
        RelationMutate.Cascade,
    )
}

// Main function to create all schemas in the correct order
export async function createAllSchemas() {
    try {
        console.log('Starting schema creation...');
        
        // Step 1: Create base collections first
        console.log('Creating Users collection...');
        await createUser();
        
        console.log('Creating Chats collection...');
        await createChat();
        
        console.log('Creating ChatMessages collection...');
        await createChatMessage();
        
        console.log('Creating Streams collection...');
        await createStream();
        
        // Step 2: Create relationships after collections exist
        console.log('Creating Chat-User relationship...');
        await createChatUserReference();
        
        console.log('Creating ChatMessage-Chat relationship...');
        await ChatMessageChatReference();
        
        console.log('Creating Stream-Chat relationship...');
        await createStreamChatReference();
        
        console.log('All schemas created successfully! 🎉');
    } catch (error) {
        console.error('Error creating schemas:', error);
        throw error;
    }
}

