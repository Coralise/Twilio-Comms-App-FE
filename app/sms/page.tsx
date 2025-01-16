"use client";

import { FormEvent, useEffect, useState } from "react";
import { MessageInstance } from "twilio/lib/rest/api/v2010/account/message";
import Loader from "../components/loader";
import Toast from "../components/toast";

export default function SMSPage() {
    const [inbox, setInbox] = useState<MessageInstance[]>();
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastDescription, setToastDescription] = useState("");
    const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');

    const getInbox = async () => {
        const response = await fetch('http://localhost:3001/get-inbox');
        const data = await response.json();
        
        return data.messages as MessageInstance[];
    }

    useEffect(() => {
        const setup = async () => {
            const messages = await getInbox();
            setInbox(messages);
        }

        setup();
    }, []);

    useEffect(() => {
        const eventSource = new EventSource('http://localhost:3001/message-received-event');

        eventSource.onmessage = (event) => {
            console.log("Event pinged! Refreshing inbox...");
            setTimeout(() => {
            getInbox().then(messages => setInbox(messages));
            }, 1000);
        };

        eventSource.onerror = (err) => {
            console.error('EventSource error:', err);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, []);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
    
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        form.reset();

        const to = formData.get("to");
        const message = formData.get("message");

        const response = await fetch("http://localhost:3001/send-sms", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, message }),
        });

        if (response.ok) {
            setToastType('success');
            setToastMessage(`Message sent`);
            setToastDescription(`Message sent to ${to} successfully!`);
        } else {
            setToastType('error');
            setToastMessage(`Message failed`);
            setToastDescription("There was an error sending your message.");
        }

        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 3000);
    }

    return (
        <div className="w-full flex gap-8 h-screen">
            <div className={`${toastVisible ? "opacity-1" : "opacity-0" } absolute bottom-4 right-4 transition-opacity duration-500 pointer-events-none`}>
                <Toast
                    type={toastType}
                    message={toastMessage}
                    description={toastDescription}
                    onClose={() => setToastVisible(false)}
                />
            </div>
            <div className="w-full h-full flex flex-col p-4">
                <h1 className="text-3xl">Inbox</h1>
                <div className="w-full flex flex-col mt-4 gap-1 overflow-y-auto flex-grow max-h-full">
                    {(() => {
                        if (!inbox) return <div className="w-full h-full flex items-center justify-center text-neutral-600"><Loader /></div>;
                        if (inbox.length === 0) return <div className="w-full h-full flex items-center justify-center text-neutral-600">Wow! Such empty!</div>;
                        return inbox.map(message => <InboxMessage key={message.sid} message={message} />);
                    })()}
                </div>
            </div>
            <div className="w-full h-full flex items-center justify-center">
                <div className="flex flex-col items-center justify-center dark h-screen">
                    <div className="w-full max-w-md bg-zinc-800 rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold text-zinc-200 mb-4">Send SMS</h2>

                        <form className="flex flex-wrap" onSubmit={handleSubmit}>
                            <input
                                type="text"
                                className="bg-zinc-700 text-zinc-200 border-0 rounded-md p-2 mb-4 focus:bg-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150 w-full"
                                placeholder="Destination Number"
                                name="to"
                            />
                            <textarea
                                name="message"
                                className="bg-zinc-700 text-zinc-200 border-0 rounded-md p-2 mb-auto md:mb-auto md:w-full md:h-auto md:min-h-[100px] md:max-h-[100px] md:flex-grow md:flex-shrink md:flex-auto focus:bg-zinc-md:focus:outline-none:focus:ring-blue-md:focus:border-transparent transition ease-in-out duration-fastest"
                                placeholder="Message"
                            ></textarea>

                            <button
                                type="submit"
                                className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold py-2 px-4 rounded-md mt-4 hover:bg-indigo-600 hover:to-blue-600 transition ease-in-out duration-150"
                            >
                                Submit
                            </button>
                        </form>

                    </div>
                </div>
            </div>
        </div>
    );
}

function formatDate(dateInput: string) {
    const months = [
        "January", "February", "March", "April", "May", 
        "June", "July", "August", "September", "October", 
        "November", "December"
    ];

    const date = new Date(dateInput);
    
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const amOrPm = hours >= 12 ? "PM" : "AM";

    // Convert to 12-hour format
    hours = hours % 12 || 12;

    return `${month} ${day}, ${year} - ${hours}:${minutes} ${amOrPm}`;
}

function timeElapsedSince(dateInput: string): string {
    const date = new Date(dateInput);
    const now = new Date();
    const secondsElapsed = getSecondsElapsed(now, date);

    if (secondsElapsed < 60) {
        return secondsElapsed < 10 ? "A few seconds ago" : `${secondsElapsed} seconds ago`;
    }

    const minutesElapsed = Math.floor(secondsElapsed / 60);
    if (minutesElapsed < 60) {
        return minutesElapsed === 1 ? "A minute ago" : `${minutesElapsed} minutes ago`;
    }

    const hoursElapsed = Math.floor(minutesElapsed / 60);
    if (hoursElapsed < 24) {
        return hoursElapsed === 1 ? "An hour ago" : `${hoursElapsed} hours ago`;
    }

    const daysElapsed = Math.floor(hoursElapsed / 24);
    if (daysElapsed < 30) {
        return daysElapsed === 1 ? "A day ago" : `${daysElapsed} days ago`;
    }

    const monthsElapsed = Math.floor(daysElapsed / 30);
    if (monthsElapsed < 12) {
        return monthsElapsed === 1 ? "A month ago" : `${monthsElapsed} months ago`;
    }

    const yearsElapsed = Math.floor(monthsElapsed / 12);
    return yearsElapsed === 1 ? "A year ago" : `${yearsElapsed} years ago`;
}

function getSecondsElapsed(now: Date, date: Date) {
    return Math.floor((now.getTime() - date.getTime()) / 1000);
}

function InboxMessage({ message }: Readonly<{ message: MessageInstance }>) {
    return (
        <div key={message.sid} className="mt-4 p-4 flex flex-col rounded-lg bg-neutral-900 mr-4">
            <div className="flex justify-between gap-2">
                <span className="font-bold text-lg">From: {message.from}</span>
                <div className="flex flex-col items-end">
                    <span className="">{formatDate(message.dateSent.toString())}</span>
                    <span className="">{timeElapsedSince(message.dateSent.toString())}</span>
                </div>
            </div>
            <p className="mt-4">{message.body}</p>
        </div>
    );
}