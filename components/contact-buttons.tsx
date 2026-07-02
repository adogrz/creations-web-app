import { WhatsAppIcon, MessengerIcon, InstagramIcon } from "@/components/icons";
import {
  getWhatsappLink,
  getMessengerLink,
  getInstagramLink,
} from "@/lib/contact";
import { cn } from "@/lib/utils";

type ContactButtonsProps = {
  settings: {
    whatsappNumber: string;
    messengerHandle: string;
    instagramHandle: string | null;
  };
  costumeUrl?: string;
  className?: string;
};

export function ContactButtons({
  settings,
  costumeUrl,
  className,
}: ContactButtonsProps) {
  const whatsappUrl = getWhatsappLink(settings.whatsappNumber, costumeUrl);
  const messengerUrl = getMessengerLink(settings.messengerHandle, costumeUrl);
  const instagramUrl = getInstagramLink(settings.instagramHandle, costumeUrl);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:items-center",
        className,
      )}
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-[background-color] hover:bg-primary/90 sm:w-auto"
      >
        <WhatsAppIcon className="size-5" />
        Chatear por WhatsApp
      </a>
      <a
        href={messengerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-[background-color,color,border-color] hover:bg-muted sm:w-auto"
      >
        <MessengerIcon className="size-5 text-primary" />
        Mensaje por Messenger
      </a>
      {instagramUrl && (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-[background-color,color,border-color] hover:bg-muted sm:w-auto"
        >
          <InstagramIcon className="size-5 text-primary" />
          DM en Instagram
        </a>
      )}
    </div>
  );
}
