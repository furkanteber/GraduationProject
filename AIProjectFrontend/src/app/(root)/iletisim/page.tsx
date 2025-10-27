import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AccordionDemo } from "../sss/page"

export default function Contact() {
  return (
    <section
      className="flex flex-col lg:flex-row justify-center items-center 
                 text-center lg:text-left pt-35 px-6 lg:px-12 gap-10 max-w-6xl mx-auto"
    >
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>İletişime Geç</CardTitle>
        <CardDescription>
          *Bilgileri eksiksiz doldurunuz!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Ad Soyad</Label>
              <Input
                id="name"
                type="name"
                placeholder=""
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder=""
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="subject">Konu</Label>
              </div>
              <Input id="subject" type="text" required />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="message">Mesaj</Label>
              </div>
              <Textarea id="message" required />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button type="submit" className="w-full">
          Gönder
        </Button>       
      </CardFooter>
    </Card>
    <AccordionDemo/>
    </section>
   
  )
}
