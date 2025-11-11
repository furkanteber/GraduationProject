"use client";

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
import { useState } from "react"
import { toast } from "sonner";

export default function Contact() {
  const [formData, setFormData] = useState({
            name: "",
            email: "",
            subject:"",
            message:"",
    });
  
    const handleChange = (
         e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
       setFormData({ ...formData, [e.target.name]: e.target.value });
      };
    
  const handleSubmit = async () => {
      try {
        const res = await fetch("/api/form", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });  
        if (res.ok) {
          toast.success("Mesaj başarıyla gönderildi");
          setFormData({
            name: "",
            email: "",
            subject:"",
            message:"",
          });
        } else {
          toast.error("Mesaj gönderilirken bir hata oluştu");
        }
      } catch (error) {
        console.error(error);
        toast.warning("Sunucu hatası");
      }
    };



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
                name="name"
                type="text"
                placeholder=""
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                name="email"
                type="email"
                placeholder=""
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="subject">Konu</Label>
              </div>
              <Input name="subject" type="text" required value={formData.subject}
                  onChange={handleChange} />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="message">Mesaj</Label>
              </div>
              <Textarea name="message" required value={formData.message}
                  onChange={handleChange}/>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button onClick={handleSubmit} className="w-full">
          Gönder
        </Button>       
      </CardFooter>
    </Card>
    <AccordionDemo/>
    </section>
   
  )
}
