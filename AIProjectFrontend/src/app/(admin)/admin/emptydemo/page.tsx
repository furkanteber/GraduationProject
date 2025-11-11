import { IconFolderCode } from "@tabler/icons-react"
import { ArrowUpRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import Link from "next/link"

export default function EmptyDemo() {
  return (
    <div className="flex items-center justify-center">
      <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconFolderCode />
        </EmptyMedia>
        <EmptyTitle>Burada hiçbir şey yok!</EmptyTitle>
        <EmptyDescription>
          İlk mülakatına başlamak için tıkla.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
         <Link href={"/admin/interview"}>
         <Button>Yeni Mülakat</Button>
         </Link> 
          {/* <Button variant="outline"></Button> */}
        </div>
      </EmptyContent>
      <Button
        variant="link"
        asChild
        className="text-muted-foreground"
        size="sm"
      >
        <Link href="/hints-education">
          İpuçları & Eğitim <ArrowUpRightIcon />
        </Link>
      </Button>
    </Empty>
    </div>
    
  )
}
