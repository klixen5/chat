type RoomItemProps = {
  name: string
  onClick: () => void
}

export default function RoomItem({ name, onClick: handleClick }: RoomItemProps) {

  return <button onClick={handleClick}>{name}</button>
}