import emailjs from "@emailjs/browser";

export async function sendOfferEmail({
    email,
    full_name,
    position,
    department,
    mode,
    duration,
    token
}: {
    email: string;
    full_name: string;
    position: string;
    department: string;
    mode: string;
    duration: string;
    token: string;
}) {

    const base = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

    const templateParams = {
        email: email, // REQUIRED
        full_name,
        position,
        department,
        mode,
        duration,
        accept_link: `${base}/respond/${token}?action=accept`,
        decline_link: `${base}/respond/${token}?action=decline`,
    };

    // console.log("EMAIL PARAMS:", templateParams); // <-- add this once

    return emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        templateParams,
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
    );
}
