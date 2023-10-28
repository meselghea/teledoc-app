/* eslint-disable @next/next/no-img-element */
"use client";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import React, { ChangeEvent, useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import ImageKit from "imagekit";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import GenderSelect from "@/components/GenderSelect";
import RoleSelect from "@/components/RoleSelect";
import axios from "axios";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import IconRolling from "../../assets/rolling.svg";
import Link from "next/link";

interface Doctor {
	strNumber: number | null;
	username: string;
}

interface Register {
	name: string;
	email: string;
	phone: string;
	gender: Gender;
	birthDate: Date | null;
	image: string;
	doctor: Doctor;
}

interface Value {}

const publicKeyEnv = process.env.NEXT_PUBLIC_KEY as string;
const privateKeyEnv = process.env.NEXT_PUBLIC_PRIVATE_KEY as string;
const urlEndpointEnv = process.env.NEXT_PUBLIC_URL_ENDPOINT as string;

const imageKit = new ImageKit({
	publicKey: publicKeyEnv,
	privateKey: privateKeyEnv,
	urlEndpoint: urlEndpointEnv,
});

interface Gender {
	value: string;
	label: string;
}


interface Profile {
	name: string;
	image: string;
	email: string;
	phone: string;
	doctor: Doctor;
	role: string;
	birthDate: Date | null;
	gender: Gender;
	strNumber: number | null;
}

const Page = () => {
	const router = useRouter();
	const [selectedGender, setSelectedGender] = useState<Gender>({
		value: "M",
		label: "Male",
	});
	const [userProfile, setUserProfile] = useState<Profile>();
	const [imageInput, setImageInput] = useState<FileList | null>(null);
	const [birthDate, setBirthDate] = React.useState<Date | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [imageUrl, setImageUrl] = useState(userProfile?.image);


	const [selectedRole, setSelectedRole] = useState(userProfile?.role);

	const [imageUploadKey, setImageUploadKey] = useState(Date.now());

	const updateImage = async () => {
		setIsUploading(true);
		try {
			const file = imageInput ? imageInput[0] : undefined;
			console.log(file);

			const imageKitResponse = await imageKit.upload({
				file: file as any,
				fileName: `${Date.now()}-${file}`,
			});

			setImageUrl(`${imageKitResponse.url}?${imageUploadKey}`);
		} catch (error) {
			console.log(error);
		}
		setIsUploading(false);
	};

	useEffect(() => {
		updateImage();
	}, [imageInput]);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<Register>({
		values: {
			name: !userProfile?.name ? "" : userProfile?.name,
			email: !userProfile?.email ? "" : userProfile?.email,
			phone: !userProfile?.phone ? "" : String(userProfile?.phone),
			//password: !userProfile?.password ? "" : userProfile?.password,
			image: !userProfile?.image ? "" : userProfile?.image,
			gender: !userProfile?.gender
			 ? { value: "", label: "" }
			: userProfile?.gender,
			birthDate: !userProfile?.birthDate ? null : userProfile?.birthDate,
			doctor: {
				strNumber: !userProfile?.doctor?.strNumber ? null : userProfile?.doctor?.strNumber,
				username: !userProfile?.doctor?.username ? "" : userProfile?.doctor?.username,
			}
		},
		mode: "onTouched",
	});

	const getUserProfile = async () => {
		const response = await axios.get("../api/users/me");
		console.log(response.data.data.user);

		setUserProfile(response.data.data.user);
		setSelectedGender({
			value: response.data.data.user.gender,
			label: response.data.data.user.gender == "M" ? "Male" : "Female",
		});
	};
	const { data: session } = useSession();

	const userId = session?.user?.id;
	const userRole = session?.user?.role;
	let callbackUrl = "/profile/";

	const onSubmit: SubmitHandler<Register> = async (data) => {
		console.log(data);

		try {
			const updateUserResponse = await fetch("../api/users/me", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: data.email || userProfile?.email,
					name: data.name || userProfile?.name,
					phone: data.phone || userProfile?.phone,
					//password: data.password,
					image: imageUrl ? imageUrl : userProfile?.image,
					birthDate: data.birthDate || userProfile?.birthDate, 
					gender: data.gender || userProfile?.gender,
				}),
			});

			if (updateUserResponse.status === 200) {
				alert("User Profile Successfully Updated");
			  } else {
				console.error("User Profile update failed");
			  }
		  
			  // If the user role is 'doctor', update doctor details
			  if (userRole === 'doctor') {
				const updateDoctorResponse = await fetch(`../api/doctor/${userId}`, {
					method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
				  strNumber: data.doctor?.strNumber || userProfile?.doctor?.strNumber,
				  username: data.doctor?.username || userProfile?.doctor?.username,
				}),
				});
		  
				if (updateDoctorResponse.status === 200) {
				  alert("Doctor Profile Successfully Updated");
				} else {
				  console.error("Doctor Profile update failed");
				}
			  }

				if (userRole === "patient") {
					callbackUrl += `patient`;
					router.push(callbackUrl);
				} else if (userRole === "doctor") {
					callbackUrl += `doctor`;
					router.push(callbackUrl);
				}
			  } catch (error) {
				console.error(error);
			  }
			};

	const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		setImageInput(e.target.files);
	};

	useEffect(() => {
		getUserProfile();
	}, []);

	return (
		// PAGE
		<div className="flex items-center justify-center w-screen px-4 py-4 overflow-y-scroll bg-white h-fit">
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="w-full max-w-[400px] flex flex-col items-center gap-4 py-4 overflow-y-scroll"
			>
				<nav className="relative flex items-center justify-center w-full">
				<Link href={`/home/${userProfile?.role}`} className="absolute left-0">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							className="w-6 h-6"
						>
							<path
								fillRule="evenodd"
								d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z"
								clipRule="evenodd"
							/>
						</svg>
					</Link>
					<h1 className="text-[#ff5757] text-2xl font-bold">Personal Detail</h1>
				</nav>
				{/*IMAGE*/}
				<div className="flex flex-col items-center gap-4">
					<div className="w-[150px] h-[150px] rounded-full overflow-hidden relative">
						{!imageUrl ? (
							<img width={150} height={150} src={userProfile?.image} alt="" />
						) : !imageUrl && !userProfile?.image ? (
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								className="w-full h-full text-[#d9d9d9]"
							>
								<path
									fillRule="evenodd"
									d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
									clipRule="evenodd"
								/>
							</svg>
						) : (
							<Image width={150} height={150} src={imageUrl} alt="" />
						)}
						{/* LOADING */}
						{isUploading && (
							<div className="absolute top-0 left-0 z-50 flex items-center justify-center w-full h-full bg-white/80">
								<Image width={40} height={40} src={IconRolling} alt="" />
							</div>
						)}
					</div>
					<button
						className={`relative border ${
							errors.image ? "border-amber-500" : "border-[#ff5757]"
						}  rounded-full overflow-hidden hover:cursor-pointer px-3 py-1 ${
							isUploading && "animate-pulse"
						}`}
					>
						<p
							className={`hover:cursor-pointer ${
								errors.image ? "text-amber-500" : "text-[#ff5757]"
							}`}
						>
							{isUploading
								? "Uploading..."
								: !isUploading && !errors.image && imageInput == null
								? "Upload an image"
								: !isUploading && !errors.image && imageInput !== null
								? "Change image"
								: errors.image?.message}
						</p>
						<input
							type="file"
							className="absolute top-0 left-0 z-20 w-full h-full bg-blue-300 opacity-0 hover:cursor-pointer"
							accept="image/*"
							onChange={handleFileInputChange}
						/>
					</button>
				</div>
				{/* NAME */}

				<div className="w-full">
					<label className="text-black" htmlFor="name">
						Name
					</label>
					<input
						id="name"
						type="text"
						placeholder="Enter your name"
						defaultValue={userProfile?.name}
						{...register("name", {
							required: {
								value: true,
								message: "Name is a required field",
							},
						})}
						className={`bg-[#d9d9d9]/30 h-[60px] px-4 rounded-lg border  text-black  w-full outline-none ${
							errors?.name
								? "border-amber-500 focus:border-amber-500"
								: "focus:border-[#ff5757] border-[#d9d9d9]"
						} `}
					/>
					<p className="text-amber-500">{errors?.name?.message}</p>
				</div>

				{/* STR NUMBER */}
{ userProfile?.role === "doctor" && (
  <div className="w-full">
    <label className="text-black" htmlFor="strnumber">
      Str Number
    </label>
    <input
      id="strnumber"
      type="number"
      placeholder="Enter Str number"
	  defaultValue={userProfile?.doctor?.strNumber ?? ""}
      {...register("doctor.strNumber", {
        required: {
          value: true,
          message: "Str number is a required field",
        },
      })}
      className={`bg-[#d9d9d9]/30 h-[60px] px-4 rounded-lg border  text-black  w-full outline-none ${
        errors?.doctor?.strNumber
          ? "border-amber-500 focus-border-amber-500"
          : "focus-border-[#ff5757] border-[#d9d9d9]"
      }`}
    />
    <p className="text-amber-500">{errors?.doctor?.strNumber?.message}</p>
  </div>
)}

{/* USERNAME */}
{userProfile?.role === "doctor" && (
  <div className="w-full">
    <label className="text-black" htmlFor="username">
      Username
    </label>
    <input
      id="username"
      type="text"
      placeholder="Enter your username"
      defaultValue={userProfile?.doctor?.username}
      {...register("doctor.username", {
        required: {
          value: true,
          message: "Username is a required field",
        },
      })}
      className={`bg-[#d9d9d9]/30 h-[60px] px-4 rounded-lg border  text-black  w-full outline-none ${
        errors?.doctor?.username
          ? "border-amber-500 focus-border-amber-500"
          : "focus-border-[#ff5757] border-[#d9d9d9]"
      }`}
    />
    <p className="text-amber-500">{errors?.doctor?.username?.message}</p>
  </div>
)}

				{/* EMAIL */}
				<div className="w-full">
					<label className="text-black" htmlFor="email">
						Email
					</label>
					<input
						id="email"
						{...register("email")}
						defaultValue={userProfile?.email}
						type="email"
						placeholder="Enter your email"
						{...register("email", {
							required: {
								value: true,
								message: "Email is a required field",
							},
							pattern: {
								value: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
								message: "Entered value does not match email format",
							},
						})}
						className={`bg-[#d9d9d9]/30 h-[60px] px-4 rounded-lg border  text-black  w-full outline-none ${
							errors?.email
								? "border-amber-500 focus:border-amber-500"
								: "focus:border-[#ff5757] border-[#d9d9d9]"
						} `}
					/>
					<p className="text-amber-500">{errors?.email?.message}</p>
				</div>

				{/* PHONE NUMBER */}
				<div className="w-full">
					<label className="text-black" htmlFor="phoneNumber">
						Phone Number
					</label>
					<input
						id="phone"
						type="text"
						placeholder="(XXX)-XXXX-XXXX"
						defaultValue={userProfile?.phone}
						{...register("phone", {
							required: {
								value: true,
								message: "Phone number is a required field",
							},
						})}
						className={`bg-[#d9d9d9]/30 h-[60px] px-4 rounded-lg border  black w-full outline-none ${
							errors?.phone
								? "border-amber-500 focus:border-amber-500"
								: "focus:border-[#ff5757] border-[#d9d9d9]"
						} `}
					/>
					<p className="text-amber-500">{errors?.phone?.message}</p>
				</div>

				{/* PASSWORD */}
				{/* <div className="w-full">
					<label className="text-black" htmlFor="password">
						Password
					</label>
					<input
						id="password"
						defaultValue={userProfile?.password}
						type="password"
						placeholder="Enter your password"
						{...register("password", {
						// 	required: {
						// 	  value: true,
						// 	message: "Password is a required field",
						//  },
						})}
						className={`bg-[#d9d9d9]/30 h-[60px] px-4 rounded-lg border  text-black w-full outline-none ${
							errors?.password
								? "border-amber-500 focus:border-amber-500"
								: "focus:border-[#ff5757] border-[#d9d9d9]"
						} `}
					/>
					<p className="text-amber-500">{errors?.password?.message}</p>
				</div> */}
				{/*BIRTHDATE*/}
				<p className="w-full -mb-4 text-left text-black">Birth Date</p>
				<LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            value={birthDate}
            onChange={(date) => setBirthDate(date)}
            format="YYYY - MM - DD"
			defaultValue={userProfile?.birthDate}
            sx={{
              width: "100%",
              backgroundColor: "rgba(217, 217, 217, 0.3)",
              borderRadius: "8px",
            }}
          />
        </LocalizationProvider>
				<h1 className="text-black">{birthDate?.toString()}</h1>

				{/*GENDER*/}
				<GenderSelect
          selectedGender={selectedGender}
          setSelectedGender={setSelectedGender}
        />
        {/* <RoleSelect
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
        /> */}

				{/* SUBMIT */}
				<button
					type="submit"
					className="bg-[#ff5757] rounded-lg w-full h-[60px] font-semibold text-white mt-8"
				>
					Update Profile
				</button>
			</form>
		</div>
	);
};

export default Page;
