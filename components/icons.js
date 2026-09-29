import {
  Lightbulb, Camera, Zap, ZapOff, Wind, Car, CarFront, Thermometer, AlertTriangle, Clock,
  CheckCircle, Sun, Moon, Flame, Leaf, Bike, Server, Cloud, Code, Globe,
} from "lucide-react";

// Los datos guardan el nombre del ícono como texto; aquí se resuelve el componente.
export const ICONS = {
  Lightbulb, Camera, Zap, ZapOff, Wind, Car, CarFront, Thermometer, AlertTriangle, Clock,
  CheckCircle, Sun, Moon, Flame, Leaf, Bike, Server, Cloud, Code, Globe,
};

export function Icon({ name, ...props }) {
  const Component = ICONS[name] ?? Zap;
  return <Component {...props} />;
}
