import { Textarea } from "@/components/ui/textarea";
import { Webcam } from "lucide-react";
import CameraPage from "../camera/page";

export default function Interview() {
  return (
        <div className="flex flex-1 gap-4 p-4 h-[calc(100vh-var(--header-height))]">
          <div className="w-2/3 bg-gray-100 p-4 rounded-md overflow-auto">
            <h2 className="text-lg font-semibold mb-2">Soru</h2>
            <p>
              Buraya sorular gelecek. 
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Harum expedita quis quam omnis delectus vitae maiores consequatur rem. Corrupti at architecto eveniet maxime molestias eius sapiente qui et quia eos.
              Quod, architecto magni modi eos distinctio fugiat consequatur non quisquam cumque, officia dignissimos eveniet laboriosam quasi. Quasi, iste nesciunt minus similique, impedit officiis officia illum ipsum consectetur commodi a unde.
              Saepe nisi harum error, distinctio, quidem amet perferendis eius quibusdam beatae est laborum repellat, tenetur hic incidunt magni pariatur nostrum id repellendus culpa sed eaque rem fuga. Nostrum, eos maxime.
              Excepturi molestias ullam obcaecati, consectetur expedita praesentium vel eos laborum et, provident esse assumenda a, sapiente sint. Excepturi nobis, quas eum laborum, saepe asperiores id impedit voluptas assumenda voluptatum expedita?
              Culpa distinctio quasi in explicabo sint reiciendis autem numquam incidunt cupiditate. Explicabo repudiandae unde saepe deserunt! Impedit, quidem, quo maiores, nemo laboriosam voluptatem earum expedita odit excepturi modi dolore doloremque?
              Fugit officiis expedita aspernatur in nulla a ipsum voluptatibus, labore cupiditate laborum illo doloremque quod dignissimos harum non possimus nihil veritatis sunt neque id. Nemo earum excepturi eum quia similique!
              Doloribus dolorum, nulla ullam id inventore magni voluptate quo nam quae reprehenderit! In temporibus quidem, corrupti ipsum eveniet nihil ipsam mollitia dolores exercitationem officiis harum alias sit modi nemo molestias?
            </p>
          </div>

          <div className="w-1/3 flex flex-col gap-4">
            <div className="flex-1 bg-gray-200 flex items-center justify-center rounded-md">
             <CameraPage/>
            </div>

            <div className="h-1/2">
              <Textarea placeholder="Cevabınızı yazın." className="h-full" />
            </div>
          </div>
        </div>     
  )
}
