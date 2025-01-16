"use client";

import { Client, Message, Conversation, Paginator } from "@twilio/conversations";
import { useState, useEffect, ChangeEvent, FormEvent, useRef } from "react";
import { FaPaperclip } from "react-icons/fa";
import { initializeConversationsClient, joinAndGetConversation, sendMessage } from "./twilio/conversation";
import { useRouter } from "next/navigation";
import Loader from "./components/loader";

export default function ConversationComponent() {

    const router = useRouter();
    const scrollRef = useRef<HTMLDivElement>(null);

    const [identity, setIdentity] = useState<string>();
    const [conversationsClient, setConversationsClient] = useState<Client>();
    const [conversation, setConversation] = useState<Conversation>();
    const [messages, setMessages] = useState<{
        message: Message;
        media: string | null;
    }[]>();
    const [file, setFile] = useState<File | undefined>();

    const getAllMessages = async (conversation: Conversation): Promise<Message[]> => {
        let allMessages: Message[] = [];
        let paginator: Paginator<Message> = await conversation.getMessages();
      
        // Fetch the first page and add the messages
        allMessages = [...paginator.items, ...allMessages];
      
        // Check if there are more pages and fetch them
        while (paginator.hasPrevPage) {
          paginator = await paginator.prevPage();
          allMessages = [...paginator.items, ...allMessages];  // Append the next page's messages
        }
      
        console.log("Msg count:", allMessages.length);
        return allMessages;
    };

    useEffect(() => {
        let chosenIdentity: string | null = localStorage.getItem("participantIdentity");

        if (!chosenIdentity) {
            router.push("/identity");
            return;
        }

        setIdentity(chosenIdentity);

        const setup = async () => {
            const conversationSid = "CH7ad27ed6f90245f5ab9c4e2f64896b00";
            const client = await initializeConversationsClient(chosenIdentity);
            if (!client) throw new Error("Client is null");
            setConversationsClient(client);
            
            const promises = await Promise.all([joinAndGetConversation(client, conversationSid, chosenIdentity), client.getConversationBySid(conversationSid)]);

            const conv: Conversation = promises[1];
            setConversation(conv);

            const messages = await getAllMessages(conv);
            const medias = await Promise.all(messages.map(msg => {
                if (msg.attachedMedia!.length == 0) return null;
                return msg.attachedMedia![0].getContentTemporaryUrl();
            }));
            const updatedMessages = messages.map((msg, index) => {
                return {
                    message: msg,
                    media: medias[index]
                };
            });
            console.log(updatedMessages);
            setMessages(updatedMessages);

            conv.on('messageAdded', async (message) => {
                const updatedMessage = {
                    message: message,
                    media: message.attachedMedia!.length > 0 ? await message.attachedMedia![0].getContentTemporaryUrl() : null
                };
                setMessages((prevMessages) => {
                    window.scrollTo(0, document.getElementById("chatDisplay")!.scrollHeight);
                    return [...prevMessages ?? [], updatedMessage]
                });
            });
        };

        setup();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
    
        const form = event.target as HTMLFormElement;

        const message = new FormData(form).get("message");
    
        sendMessage(conversationsClient!, conversation!.sid, identity!, message as string, file);
        form.reset();
        setFile(undefined);
        console.log("Here submit:", messages);
    };

    return (
        <div className="h-screen w-full flex items-center justify-center">
            <form
                onSubmit={handleSubmit}
                className="max-w-md mx-auto bg-white dark:bg-zinc-800 shadow-md rounded-lg overflow-hidden"
            >
                <div className="flex flex-col h-[400px]">
                    <div className="px-4 py-3 border-b dark:border-zinc-700">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-zinc-800 dark:text-white">
                                {conversation ? conversation.friendlyName : "Loading..."}
                            </h2>
                        </div>
                    </div>
                    <div
                        className="flex-1 p-3 overflow-y-auto flex flex-col space-y-2"
                        id="chatDisplay" ref={scrollRef}
                    >
                        {(() => {
                            if (!messages) {
                                return <div className="w-full h-full flex items-center justify-center text-neutral-600"><Loader /></div>;
                            }
                            if (messages.length === 0) {
                                return <div className="w-full h-full flex items-center justify-center text-neutral-600">Wow! Such empty!</div>;
                            }
                            return messages.map((message, index) => (
                                message.message.author === identity ? <Sent key={message.message.sid} message={message} /> : <Received key={message.message.sid} message={message} />
                            ));
                        })()}
                    </div>
                    <div className="px-3 py-2 border-t dark:border-zinc-700">
                        <div className="flex gap-2 flex-col">
                            <div className="flex gap-2">
                                <input
                                    placeholder="Type your message..."
                                    className="flex-1 p-2 border rounded-lg dark:bg-zinc-700 dark:text-white dark:border-zinc-600 text-sm"
                                    id="chatInput"
                                    type="text"
                                    name="message" />
                                <button
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg transition duration-300 ease-in-out text-sm"
                                    id="sendButton"
                                >
                                    Send
                                </button>
                            </div>
                            <input
                                className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-1.5 px-3 rounded-lg transition duration-300 ease-in-out text-sm"
                                id="file"
                                name="file"
                                type="file"
                                onChange={handleFileChange} />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

interface MessageProps {
    message: {
        message: Message;
        media: string | null;
    };
}
function Sent({ message }: Readonly<MessageProps>) {
    return <div
        className="chat-message self-end bg-blue-500 text-white max-w-xs rounded-lg px-3 py-1.5 text-sm flex flex-col gap-2"
    >
        {message.message.body!.length > 0 ? <span>{message.message.body}</span> : <></>}
        {message.media ? <a target="_blank" href={message.media} download={message.message.attachedMedia![0].filename}>{message.message.attachedMedia![0].contentType.startsWith("image") ? <img alt={message.message.attachedMedia![0].filename!} src={message.media} /> : <span className="flex gap-2 items-center"><span>{message.message.attachedMedia![0].filename}</span><FaPaperclip /></span>}</a> : <></>}
    </div>
}

function Received({ message }: Readonly<MessageProps>) {
    return <div className="flex flex-col">
        {message.message.author}
        <div
        className="chat-message self-start bg-zinc-500 text-white max-w-xs rounded-lg px-3 py-1.5 text-sm flex flex-col gap-2"
        >
        {message.message.body!.length > 0 ? <span>{message.message.body}</span> : <></>}
        {message.media ? <a target="_blank" href={message.media} download={message.message.attachedMedia![0].filename}>{message.message.attachedMedia![0].contentType.startsWith("image") ? <img alt={message.message.attachedMedia![0].filename!} src={message.media} /> : <span className="flex gap-2 items-center"><FaPaperclip /><span>{message.message.attachedMedia![0].filename}</span></span>}</a> : <></>}
        </div>
    </div>;
}
