type RoomItemProps = {
  name: string
}

export default function RoomItem({ name }: RoomItemProps) {

  return <button>{name}</button>
}