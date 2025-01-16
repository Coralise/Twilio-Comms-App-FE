import { Client, Conversation, Message, SendMediaOptions } from "@twilio/conversations";

export async function fetchToken(identity : string) {
    if (true || !localStorage.getItem(`token-${identity}`) || Date.now() - Number.parseInt(localStorage.getItem(`tokenCreationTime-${identity}`)!) >= 3000000) {
        const response = await fetch('http://localhost:3001/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity }),
        });
        const data = await response.json();
        localStorage.setItem(`token-${identity}`, JSON.stringify(data.token));
        localStorage.setItem(`tokenCreationTime-${identity}`, Date.now().toString());
        return data.token;
    } else {
        const parsedToken = JSON.parse(localStorage.getItem(`token-${identity}`)!);
        return parsedToken;
    }
}

export const initializeConversationsClient = async (identity: string) => {
    try {
        const token = await fetchToken(identity);
        const client = new Client(token);

        client.on('connectionStateChanged', (state) => {
            if (state === 'connected') {
                console.log('Connected to Twilio Comms App');
            }
        });

        return client;
    } catch (error) {
        console.error('Error initializing client:', error);
        return null;
    }
};

export const joinAndGetConversation = async (client : Client, conversationSid : string, participantIdentity: string): Promise<Conversation | null> => {

    try {
        const response = await fetch('http://localhost:3001/join-and-get-conversation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationSid, participantIdentity }),
        });

        if (response.ok) {
            const data = await response.json();

            console.log('Successfully joined conversation:', data.message);

            return data.conversation;
        } else {
            const errorData = await response.json();
            console.error('Error joining conversation:', errorData.error);
            return null;
        }
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
};

export const createConversation = async (client : Client, friendlyName : string) => {
    const conversation = await client.createConversation({
        friendlyName: friendlyName,
    });
    console.log(conversation);
    console.log('New conversation created:', conversation.sid);

    return conversation;
};

export const fetchConversations = async () => {
    try {
        const response = await fetch('http://localhost:3001/list-conversations');
        if (response.ok) {
            const conversations = await response.json();
            console.log('Conversations:', conversations);
            return conversations;
        } else {
            console.error('Failed to fetch conversations');
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

export const sendMessage = async (conversationsClient: Client, conversationSid: string, identity: string, message: string, file?: File) => {

    const conv = await conversationsClient.getConversationBySid(conversationSid);
    const msgBuilder = conv.prepareMessage();
    msgBuilder.setBody(message);

    if (file) {
        const response = await uploadMedia(file);

        if (response.ok) {
            console.log('File uploaded successfully!');
        } else {
            console.log('Failed to upload the file. Aborting action...');
            return;
        }

        const resData = await response.json();

        const msgFile = await fetch(resData.mediaUrl);
        const arrayBuffer = await msgFile.arrayBuffer(); // Read the response as ArrayBuffer
        const buffer = Buffer.from(arrayBuffer); // Convert the ArrayBuffer into a Buffer
        const sendMediaOptions: SendMediaOptions = {
            contentType: msgFile.headers.get("Content-Type"),
            filename: file.name,
            media: buffer
        };
        msgBuilder.addMedia(sendMediaOptions);
    }
    await msgBuilder.build().send();
    console.log("Message sent!");
}

export const getMessages = async (conversationSid : string): Promise<Message[]> => {
    const response = await fetch('http://localhost:3001/get-messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            conversationSid: conversationSid,
        }),
    });

    const data = await response.json();
    console.log('Messages retrieved:', data);

    return data.messages;
}

export async function uploadMedia(file: File) {
    const fileFormData = new FormData();
    fileFormData.set("file", file);

    const response = await fetch('http://localhost:3001/upload-media', {
        method: 'POST',
        body: fileFormData
    });
    
    return response;
}
