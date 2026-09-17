import React, {useEffect} from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  BriefcaseBusiness,
  Shield,
  AppWindow,
} from "lucide-react";


const PersonalInfoForm = ({
  data,
  onChange,
  removeBackground,
  setremoveBackground,
}) => {
  useEffect(() => {
    console.log("PersonalInfoForm data:", data);
  }, [data]);

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const fields = [
    {
      key: "full_name",
      label: "Full Name",
      icon: User,
      type: "text",
      required: true,
    },
    { key: "email", label: "Email", icon: Mail, type: "email", required: true },
    { key: "phone", label: "Phone Number", icon: Phone, type: "tel" },
    { key: "location", label: "Location", icon: MapPin, type: "text" },
    {
      key: "profession",
      label: "Proffesion",
      icon: BriefcaseBusiness,
      type: "text",
      required: true,
    },
    { key: "linkedin", label: "Linkedin Profile", icon: Shield, type: "url" },
    { key: "website", label: "Portfolio ", icon: AppWindow, type: "url" },
  ];

  return (
    <div>
      <h3 className="text-lg text-slate-900 font-semibold">
        Personal Information
      </h3>

      <p className="text-sm text-gray-600">
        Get started with personal information
      </p>

      <div className="flex items-center gap-3">
        <label className="cursor-pointer">
          {data.image ? (
            <img
              src={
                typeof data.image === "string"
                  ? data.image
                  : URL.createObjectURL(data.image)
              }
              className="w-16 h-16 rounded-full object-cover mt-5 ring-2 ring-slate-400 hover:opacity-80"
              alt="user"
            />
          ) : (
            <div className="inline-flex text-slate-600 hover:text-slate-900 mt-5 gap-3 items-center">
              <User className="size-7 rounded-full border" />
              Upload user image
            </div>
          )}

          <input
            type="file"
            accept="image/jpg,image/jpeg,image/png"
            className="hidden"
            onChange={(e) => handleChange("image", e.target.files[0])}
          />
        </label>

        {typeof data.image === "object" && (
          <div className="flex flex-col pl-4 text-sm gap-1">
            <p>Remove background</p>

            <label className="relative inline-flex items-center cursor-pointer gap-3">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={removeBackground}
                onChange={() => setremoveBackground((prev) => !prev)}
              />

              <div className="w-9 h-5 bg-slate-300 rounded-full peer-checked:bg-green-600 transition-colors duration-200" />

              <span
                className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full
                  transition-transform duration-200 peer-checked:translate-x-4"
              />
            </label>
          </div>
        )}
      </div>

      <div>
        {fields.map((field) => {
          const Icon = field.icon;
          return (
            <div key={field.key} className="space-y-1 mt-5">
              <label className="flex items-center gap03 text-sm font-medium text-gray-600">
                <Icon className="size-4" />
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              <input
                type={field.type}
                value={data[field.key] || ""}
                onChange={(e) => {
                  handleChange(field.key, e.target.value);
                }}
                className="mt-1 w-full px-3 py-4 border border-gray-300 rounded-lg focus:ring focus:ring-blue-500  focus:border-blue-500 outline-none  transition-colors text-sm "
                placeholder={`Enter your ${field.label.toLowerCase()}`}
                required={field.required}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PersonalInfoForm;
