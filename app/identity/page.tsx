"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import Toast from "../components/toast";

export default function IdentityPage() {
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastDescription, setToastDescription] = useState("");
    const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);

    const router = useRouter();

    useEffect(() => {
        localStorage.removeItem("participantIdentity");
    }, []);

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();

        const identity = (new FormData(event.target as HTMLFormElement).get("identity")! as string).trim();

        const isValidIdentity = /^[a-zA-Z0-9-]+$/.test(identity);
        if (!isValidIdentity) {
            showToast('error', 'Invalid Identity', 'Identity must only contain alphanumerics and dashes (-) without spaces or special characters.');
            return;
        }

        localStorage.setItem("participantIdentity", identity);
        showToast('success', 'Identity Set', 'Your identity has been set successfully.');
        setIsSubmitDisabled(true);
        setTimeout(() => router.push("/"), 1000);
    };

    const showToast = (type: 'success' | 'error' | 'warning', message: string, description: string) => {
        setToastType(type);
        setToastMessage(message);
        setToastDescription(description);
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 3000);
    };

    return (
        <div className="w-full h-screen">
            <div className={`${toastVisible ? "opacity-1" : "opacity-0" } absolute bottom-4 right-4 transition-opacity duration-500 pointer-events-none`}>
                <Toast
                    type={toastType}
                    message={toastMessage}
                    description={toastDescription}
                    onClose={() => setToastVisible(false)}
                />
            </div>
            <div className="w-full h-full flex items-center justify-center">
                <div className="flex flex-col items-center justify-center dark h-screen">
                    <div className="w-full max-w-md bg-zinc-800 rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold text-zinc-200 mb-4">Welcome! What's your identity?</h2>

                        <form className="flex flex-wrap" onSubmit={handleSubmit}>
                            <input
                                type="text"
                                className="bg-zinc-700 text-zinc-200 border-0 rounded-md p-2 mb-4 focus:bg-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150 w-full"
                                placeholder="User-1"
                                defaultValue="User-1"
                                name="identity"
                            />

                            <button
                                type="submit"
                                className={`bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold py-2 px-4 rounded-md mt-4 transition ease-in-out duration-150 ${isSubmitDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-600 hover:to-blue-600'}`}
                                disabled={isSubmitDisabled}
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