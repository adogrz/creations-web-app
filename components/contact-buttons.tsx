import { WhatsAppIcon, MessengerIcon } from '@/components/icons'
import { whatsappLink, messengerLink } from '@/lib/data'
import { cn } from '@/lib/utils'

type ContactButtonsProps = {
  costumeName?: string
  className?: string
}

export function ContactButtons({ costumeName, className }: ContactButtonsProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row', className)}>
      <a
        href={whatsappLink(costumeName)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-[background-color] hover:bg-primary/90"
      >
        <WhatsAppIcon className="size-5" />
        Chatear por WhatsApp
      </a>
      <a
        href={messengerLink()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-[background-color,color,border-color] hover:bg-muted"
      >
        <MessengerIcon className="size-5 text-primary" />
        Mensaje por Messenger
      </a>
    </div>
  )
}
