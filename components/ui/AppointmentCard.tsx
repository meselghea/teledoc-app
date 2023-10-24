"use client";

import { log } from "console";
import { useEffect, useState } from "react";
import { parseISO } from "date-fns";

interface Appointment {
  statusId: string;
  id: string;
  date: string;
  time: string;
  patient: {
    image: string;
    name: string;
  };
  rejectionReason: string;
}
export default function AppointmentCard(props: { appointment: Appointment }) {
  const rejected = "e209365d-44ef-4c5d-8eea-42c827dbaeb1";
  const accepted = "6d86abcc-f29b-4a64-9af4-4b55c4f1ee2b";
  const [isAccepted, setIsAccepted] = useState<string>(() => {
    return (
      localStorage.getItem(props.appointment.id) || props.appointment.statusId
    );
  });
  const [rejectionReason, setRejectionReason] = useState<string>("");
  useEffect(() => {
    localStorage.setItem(props.appointment.id, isAccepted);
  }, [isAccepted, props.appointment.id]);

  let now = new Date();

  const isoDateString = props.appointment.date;
  const isoDate = new Date(isoDateString);
  const options = { year: "numeric", month: "long", day: "numeric" };
  const readableDate = isoDate.toLocaleDateString(
    "en-US",
    options as Intl.DateTimeFormatOptions
  );

  const accept = async (id: string) => {
    setIsAccepted(accepted);
    setRejectionReason("");
    const response = await fetch("/api/appointment/" + id, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        statusId: accepted,
      }),
    });
  };
  const reject = async (id: string) => {
    setIsAccepted(rejected);
    const response = await fetch("/api/appointment/" + id, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        statusId: rejected,
        rejectionReason: rejectionReason,
      }),
    });
  };

  
  return (
    <div className="flex gap-4 w-full bg-[#d9d9d9]/30 rounded-lg p-6 mb-4">
      {/* PICTURE */}
      {props.appointment.patient?.image == null ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-[85px] h-[85px] text-[#d9d9d9]"
        >
          <path
            fillRule="evenodd"
            d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <div className="w-[85px] h-[85px] rounded-full p-0 bg-white overflow-hidden">
          <img
            width={85}
            height={85}
            src={props.appointment.patient?.image}
            alt=""
          />
        </div>
      )}

      {/* INFORMATIONS */}
      <div>
        <span className="text-[16px] font-semibold">
          {props.appointment.patient?.name}
        </span>
        <p className="text-[12px] text-[#858585] mb-3">
          {readableDate}
          {/* {props.appointment.date} */}
        </p>
        <p className="text-[12px] text-[#858585] mb-3">
          {props.appointment.time}
        </p>

        {isAccepted == accepted ? (
          <button
            className="px-4 py-1 border rounded-full border-[#ff5757] text-[#ff5757]"
            disabled
          >
            Accepted
          </button>
        ) : isAccepted == rejected ? (
          <button
            className="px-4 py-1 border rounded-full border-[#ff5757] text-[#ff5757]"
            disabled
          >
            Rejected
          </button>
        ) : (
          <div className="flex items-center gap-4">
            <button
              onClick={() => accept(props.appointment.id)}
              className="px-4 py-1 border rounded-full border-[#ff5757] bg-[#ff5757] text-white"
            >
              Accept
            </button>
            <button
              onClick={() => reject(props.appointment.id)}
              className="px-4 py-1 border rounded-full border-[#ff5757] text-[#ff5757]"
            >
              Reject
            </button>
          </div>
        )}
      </div>
      {isAccepted === rejected && (
        <div className="w-full">
          <label className="text-[16px] font-semibold">Rejection Reason:</label>
          <select
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full p-2 rounded-md border border-[#d9d9d9]"
          >
            <option value="">Select a reason</option>
            <option value="Full booked at desired time">Full booked at desired time</option>
            <option value="Doctor not on duty">Doctor not on duty</option>
            <option value="Out of doctor expertise">Out of doctor expertise</option>
            <option value="Unavailable">Unavailable</option>
          </select>
        </div>
      )}
    </div>
  );
}
