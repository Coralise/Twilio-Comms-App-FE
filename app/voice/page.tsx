"use client";

import { FormEvent, useEffect, useState } from "react";
import { Call, Device } from "@twilio/voice-sdk";
import { useRouter } from "next/navigation";
import { fetchToken } from "../twilio/conversation";
import Toast from "../components/toast";

interface CallData {
    callData: any;
}

export default function VoicePage() {
    const [callData, setCallData] = useState<any>(null);
    const [device, setDevice] = useState<Device | null>(null);
    const [identity, setIdentity] = useState<string | null>(null);
    const [call, setCall] = useState<Call>();
    const [callState, setCallState] = useState<string>();
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastDescription, setToastDescription] = useState("");
    const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');

    const router = useRouter();

    useEffect(() => {
        const eventSource = new EventSource('http://localhost:3001/incoming-call-event');

        eventSource.onmessage = (event) => {
            console.log('Event received:', event);
            const data: CallData = JSON.parse(event.data);
            const callData = data.callData;
            console.log('Parsed call data:', callData);

            // Handle the incoming call data
            if (callData.CallSid && callData.Caller) {
                console.log(`Incoming call from ${callData.Caller} with call ID ${callData.CallSid}`);
                setCallData(callData);
                // Add more handling logic here
            } else {
                console.warn('Received call data is missing required fields:', data);
            }
        };

        eventSource.onerror = (error) => {
            console.error('EventSource failed:', error);
        };

        return () => {
            console.log('Closing EventSource');
            eventSource.close();
        };
    }, []);

    useEffect(() => {
        let chosenIdentity: string | null = localStorage.getItem("participantIdentity");

        if (!chosenIdentity) {
            router.push("/identity");
            return;
        }

        setIdentity(chosenIdentity);

        // Initialize Twilio Device
        const initializeDevice = async () => {
            try {
                if (!chosenIdentity || typeof chosenIdentity !== 'string' || chosenIdentity.trim() === '') {
                    throw new Error('Invalid identity');
                }

                console.log('Using identity:', chosenIdentity);
                const token = await fetchToken(chosenIdentity);
                const device = new Device(token, {
                    enableImprovedSignalingErrorPrecision: true,
                });
                setDevice(device);

                device.on('incoming', (call) => {
                    console.log('Incoming call from:', call.parameters.From);
                    console.log(call);
                    setCall(call);
                    setCallState("incoming");
                    call.on('accept', () => {
                        setCallState('accepted');
                        showToast('success', 'Call accepted', 'The call has been accepted.');
                    });
                    call.on('cancel', () => {
                        setCallState('cancelled');
                        setCall(undefined);
                        showToast('warning', 'Call cancelled', 'The call has been cancelled.');
                    });
                    call.on('disconnect', () => {
                        setCallState('disconnected');
                        setCall(undefined);
                        showToast('warning', 'Call disconnected', 'The call has been disconnected.');
                    });
                    call.on('reject', () => {
                        setCallState('rejected');
                        setCall(undefined);
                        showToast('error', 'Call rejected', 'The call has been rejected.');
                    });
                    call.on('error', (error: any) => {
                        console.error('Call error:', error);
                        setCallState('error');
                        setCall(undefined);
                        showToast('error', 'Call error', 'An error occurred during the call.');
                    });
                });

                device.on('offline', () => console.log('Device is offline.'));
                device.on('ready', () => console.log('Device is ready.'));
                device.on('registered', () => console.log('Device is registered.'));
                device.on('unregistered', () => console.log('Device is unregistered.'));
                device.on('error', (error) => {
                    console.error('Twilio Device error:', error);
                    console.error('Error code:', error.code);
                    console.error('Error message:', error.message);
                });
                device.on('stateChanged', (state) => console.log('Device state changed:', state));

                await device.register();
            } catch (error) {
                console.error('Failed to initialize Twilio Device:', error);
                const typedError = error as { code?: string; message?: string };
                if (typedError.code) {
                    console.error('Error code:', typedError.code);
                }
                if (typedError.message) {
                    console.error('Error message:', typedError.message);
                }
            }
        };

        if (identity) {
            initializeDevice();
        }
    }, [identity]);

    useEffect(() => console.log(`Updated call status: ${callState}`), [callState]);

    const makeCall = async (e: FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const to = formData.get('to') as string;
        const phoneNumberPattern = /^\+?[1-9]\d{1,14}$/;
        if (!phoneNumberPattern.test(to)) {
            alert('Please enter a valid phone number.');
            return;
        }
        const call = await device!.connect({ params: { To: to } });
        setCall(call);
        console.log(call);
        setCallState("calling");
        call.on('accept', () => {
            setCallState('accepted');
            showToast('success', 'Call accepted', 'The call has been accepted.');
        });
        call.on('cancel', () => {
            setCallState('cancelled');
            setCall(undefined);
            showToast('warning', 'Call cancelled', 'The call has been cancelled.');
        });
        call.on('disconnect', () => {
            setCallState('disconnected');
            setCall(undefined);
            showToast('warning', 'Call disconnected', 'The call has been disconnected.');
        });
        call.on('reject', () => {
            setCallState('rejected');
            setCall(undefined);
            showToast('error', 'Call rejected', 'The call has been rejected.');
        });
        call.on('error', (error) => {
            console.error('Call error:', error);
            setCallState('error');
            setCall(undefined);
            showToast('error', 'Call error', 'An error occurred during the call.');
        });
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

            {call && callState == "incoming" && (
                <div className="absolute z-10 p-4 bg-zinc-900 rounded-2xl flex flex-col gap-2 items-center top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 shadow-lg">
                    <span className="text-2xl font-extrabold">Incoming call</span>
                    <span className="text-lg">{call.parameters.From}</span>
                    <div className="flex gap-4 w-full justify-center">
                        <button
                            className="cursor-pointer transition-all bg-blue-500 text-white px-6 py-2 rounded-lg
                                border-blue-600
                                border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px]
                                active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
                            onClick={() => { call.accept(); }}
                        >
                            Accept
                        </button>
                        <button
                            className="cursor-pointer transition-all bg-red-500 text-white px-6 py-2 rounded-lg
                                border-red-600
                                border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px]
                                active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
                            onClick={() => { call.reject(); }}
                        >
                            Decline
                        </button>
                    </div>
                </div>
            )}
            {call && callState == "accepted" && (
                <div className="absolute z-10 p-4 bg-zinc-900 rounded-2xl flex flex-col gap-2 items-center top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 shadow-lg">
                    <span className="text-2xl font-extrabold">Call in progress</span>
                    <span className="text-lg">{call.parameters.To ?? call.customParameters.get("To")}</span>
                    <div className="flex gap-4 w-full justify-center">
                        <button
                            className="cursor-pointer transition-all bg-red-500 text-white px-6 py-2 rounded-lg
                                border-red-600
                                border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px]
                                active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
                            onClick={() => { call.disconnect(); }}
                        >
                            Disconnect
                        </button>
                    </div>
                </div>
            )}

            <div className="w-full h-full flex items-center justify-center">
                <div className="flex flex-col items-center justify-center dark h-screen">
                    <div className="w-full max-w-md bg-zinc-800 rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold text-zinc-200 mb-4">Call Number</h2>

                        <form className="flex flex-wrap" onSubmit={makeCall}>
                            <input
                                type="text"
                                className="bg-zinc-700 text-zinc-200 border-0 rounded-md p-2 mb-4 focus:bg-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150 w-full"
                                placeholder="+XXXXXXXXXXX"
                                name="to"
                                pattern="^\+\d{1,14}$"
                                title="Please enter a valid phone number starting with +"
                                required
                            />

                            <button
                                type="submit"
                                className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold py-2 px-4 rounded-md mt-2 hover:bg-indigo-600 hover:to-blue-600 transition ease-in-out duration-150"
                            >
                                Call
                            </button>
                        </form>
                        
                    </div>
                </div>
            </div>
        </div>
    );
}