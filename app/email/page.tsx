"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import Loader from "../components/loader";
import { RiRefreshFill } from "react-icons/ri";
import Toast from "../components/toast";

interface Email {
    from: string;
    cc?: string;
    bcc?: string;
    subject: string;
    date: string;
    body: string;
    attachments: {
        filename: string;
        url: string;
    }[];
}

export default function EmailPage() {
    const [file, setFile] = useState<File>();
    const [emails, setEmails] = useState<Email[]>();
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastDescription, setToastDescription] = useState("");
    const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');

    const refreshInbox = async () => {
        setEmails();
        const emailsResponse = await fetch('http://localhost:3001/emails');
        console.log(emailsResponse);
        const emailsData: Email[] = await emailsResponse.json();
        setEmails(emailsData);
    }

    useEffect(() => {
        refreshInbox();
    }, []);
    
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
    
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        formData.delete("file");

        form.reset();
        setFile(undefined);

        const to = formData.get("to");
        const cc = formData.get("cc");
        const bcc = formData.get("bcc");
        const subject = formData.get("subject");
        const message = formData.get("message");

        let attachment;
        if (file) {
            const reader = new FileReader();

            reader.onload = async (e) => {
                if (reader.result) {
                    const content = _arrayBufferToBase64(reader.result as ArrayBuffer);
                    const at = {
                        filename: file.name,
                        content: content, // Base64 content of the file
                        type: file.type,
                        disposition: 'attachment', // How the file is handled by the email client
                    }
                    attachment = at;
                    console.log(attachment);

                    const response = await fetch("http://localhost:3001/send-email", {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to,
                            cc,
                            bcc,
                            subject,
                            message,
                            attachment
                        })
                    });

                    console.log(response);
                    setToastType('success');
                    setToastMessage(`Email sent`);
                    setToastDescription(`Email sent to ${to} successfully!`);
                    setToastVisible(true);
                }
            }

            reader.readAsArrayBuffer(file);
        } else {
            const response = await fetch("http://localhost:3001/send-email", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to,
                    cc,
                    bcc,
                    subject,
                    message
                })
            });

            console.log(response);
            setToastType('success');
            setToastMessage(`Email sent`);
            setToastDescription(`Email sent to ${to} successfully!`);
            setToastVisible(true);
        }

        setTimeout(() => setToastVisible(false), 3000);
    };

    const handleEmailClick = (email: Email) => {
        setSelectedEmail(email);
    };

    const handleCloseModal = () => {
        setSelectedEmail(null);
    };

    const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            handleCloseModal();
        }
    };

    return (
        <div className="w-full h-screen p-4 pt-14 flex gap-8">
            <div className={`${toastVisible ? "opacity-1" : "opacity-0" } absolute bottom-4 right-4 transition-opacity duration-500 pointer-events-none`}>
                <Toast
                    type={toastType}
                    message={toastMessage}
                    description={toastDescription}
                    onClose={() => setToastVisible(false)}
                />
            </div>
            <div className="flex-1 flex flex-col">
                <div className="flex gap-2 items-center"><h1 className="text-2xl font-bold text-zinc-200">Email Inbox</h1><button onClick={refreshInbox} className="rounded-full text-2xl transition-all duration-500 hover:rotate-90"><RiRefreshFill /></button></div>
                <div className="flex-1 mt-4 flex flex-col gap-4 overflow-y-auto">
                    {(() => {
                        if (!emails) {
                            return <div className="w-full h-full flex items-center justify-center text-neutral-600"><Loader /></div>;
                        }
                        if (emails.length === 0) {
                            return <div className="w-full h-full flex items-center justify-center text-neutral-600">Wow! Such empty!</div>;
                        }
                        return emails.map((email, index) => (
                            <EmailInboxItem key={index} email={email} onClick={() => handleEmailClick(email)} />
                        ));
                    })()}
                </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center dark h-fit">
                <div className="w-full bg-zinc-800 rounded-lg shadow-md p-6 h-full">
                    <h2 className="text-2xl font-bold text-zinc-200 mb-4">Send Email</h2>

                    <form className="flex flex-col" onSubmit={handleSubmit}>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                className="bg-zinc-700 text-zinc-200 border-0 rounded-md p-2 mb-4 focus:bg-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150 w-full"
                                placeholder="Recipients (Comma separated)"
                                name="to"
                            />
                            <input
                                type="text"
                                className="bg-zinc-700 text-zinc-200 border-0 rounded-md p-2 mb-4 focus:bg-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150 w-full"
                                placeholder="CC (Comma separated)"
                                name="cc"
                            />
                            <input
                                type="text"
                                className="bg-zinc-700 text-zinc-200 border-0 rounded-md p-2 mb-4 focus:bg-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150 w-full"
                                placeholder="BCC (Comma separated)"
                                name="bcc"
                            />
                        </div>
                        <input
                            type="text"
                            className="bg-zinc-700 text-zinc-200 border-0 rounded-md p-2 mb-4 focus:bg-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150 w-full"
                            placeholder="Subject"
                            name="subject"
                        />
                        <textarea
                            name="message"
                            className="bg-zinc-700 text-zinc-200 border-0 rounded-md p-2 mb-auto md:mb-auto md:w-full focus:bg-zinc-md:focus:outline-none:focus:ring-blue-md:focus:border-transparent transition ease-in-out duration-fastest"
                            placeholder="Message"
                        ></textarea>
                        <input
                            type="file"
                            className="bg-zinc-700 text-zinc-200 border-0 rounded-md p-2 mt-4 focus:bg-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150 w-full"
                            name="file"
                            onChange={handleFileChange}
                        />

                        <button
                            type="submit"
                            className="w-fit bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold py-2 px-4 rounded-md mt-4 hover:bg-indigo-600 hover:to-blue-600 transition ease-in-out duration-150"
                        >
                            Send
                        </button>
                    </form>

                </div>
            </div>
            {selectedEmail && (
                <>
                    <button className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" onClick={handleOutsideClick} />
                    <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-zinc-800 p-6 rounded-lg shadow-lg w-1/2 relative pointer-events-auto max-h-[94%] overflow-y-auto my-4">
                            <button onClick={handleCloseModal} className="absolute text-2xl top-2 right-2 text-white"><IoClose /></button>
                            <h2 className="text-2xl font-bold mb-4 text-white">{selectedEmail.subject}</h2>
                            <div className="flex justify-between text-white">
                                <p className="text-zinc-400">{selectedEmail.from}</p>
                                <p className="text-zinc-400">{new Date(selectedEmail.date).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                            </div>
                            <p className="text-zinc-400"><strong>Recipients:</strong> me{selectedEmail.cc ? `, ${selectedEmail.cc}` : ''}</p>
                            <div className="text-white mt-4" dangerouslySetInnerHTML={{ __html: selectedEmail.body }} />
                            {selectedEmail.attachments.length > 0 && (
                                <>
                                    <p className="text-white mt-4"><strong>Attachments:</strong></p>
                                    <ul>
                                        {selectedEmail.attachments.map((attachment, index) => (
                                            <li key={index}>
                                                <a target="_blank" href={attachment.url} download={attachment.filename} className="text-blue-500 cursor-pointer">{attachment.filename}</a>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function EmailInboxItem({ email, onClick }: Readonly<{ email: Email, onClick: () => void }>) {
    return (
        <button onClick={onClick}>
            <div className="rounded-lg bg-zinc-800 p-3 flex flex-col text-left">
                <div className="flex justify-between">
                    <div className="text-xl text-white">{email.subject}</div>
                    <div className="text-white">{new Date(email.date).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                </div>
                <div className="flex justify-between text-sm">
                    <div className="text-white">{email.from}</div>
                    <div className="text-zinc-500">{email.attachments.length > 0 && `${email.attachments.length} Attachment(s)`}</div>
                </div>
            </div>
        </button>
    );
}

function _arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    let bytes = new Uint8Array(buffer);
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

interface DynamicObject {
    [key: string]: any; // Allows any key with any value type
}