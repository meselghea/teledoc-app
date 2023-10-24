import { getServerSession } from "next-auth";
import { getErrorResponse } from "@/lib/helpers";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hash } from "bcrypt";
import { parseISO } from 'date-fns'; 

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return getErrorResponse(
        401,
        "You are not logged in, please provide a token to gain access"
      );
    }

    const userId = session.user.id;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        gender: true,
        birthDate: true,
        role: true,
        doctor: true,
        image: true,
        patientAppointments: {
          select: {
            id: true,
            doctor: {
              select: {
                image: true,
                doctor: {
                  select: {
                    username: true,
                    specialist: true,
                  },
                },
              },
            },
            rejectionReason: true,
            symptoms: true,
            description: true,
            time: true,
            date: true,
            status: {
              select: {
                name: true,
              },
            },
          },
        },
        doctorAppointments: {
          select: {
            id: true,
            patient: {
              select: {
                name: true,
                birthDate: true,
                gender: true,
                image: true,
              },
            },
            rejectionReason: true,
            symptoms: true,
            description: true,
            time: true,
            date: true,
            status: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      status: "success",
      data: { user: { ...user } },
    });
  } catch (error) {
    // Handle any errors here and return an appropriate response
    console.error(error);
    return getErrorResponse(
      500,
      "An error occurred while processing your request."
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return getErrorResponse(
        401,
        "You are not logged in, please provide a token to gain access"
      );
    }

    const id = session.user.id;
    let json = await request.json();
    const hashedPassword = await hash(json.password, 10);
    const parsedBirthDate = parseISO(json.birthDate);
    const updated_user = await db.user.update({
      where: { id },
      data: {...json,
        password: hashedPassword,
        birthdate: parsedBirthDate,
      }
    });

    let json_response = {
      status: "success",
      data: {
        user: updated_user,
      },
    };
    return NextResponse.json(json_response);
  } catch (error: any) {
    if (error.code === "P2025") {
      let error_response = {
        status: "fail",
        message: "No User with the Provided ID Found",
      };
      return new NextResponse(JSON.stringify(error_response), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    let error_response = {
      status: "error",
      message: error.message,
    };
    return new NextResponse(JSON.stringify(error_response), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return getErrorResponse(
        401,
        "You are not logged in, please provide a token to gain access"
      );
    }

    const id = session.user.id;
    await db.user.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error.code === "P2025") {
      let error_response = {
        status: "fail",
        message: "No User with the Provided ID Found",
      };
      return new NextResponse(JSON.stringify(error_response), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    let error_response = {
      status: "error",
      message: error.message,
    };
    return new NextResponse(JSON.stringify(error_response), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
