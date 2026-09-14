import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import { 
    submitContactForm, 
    resetContactState, 
    selectContactLoading, 
    selectContactSuccess, 
    selectContactError 
} from "../store/features/user/contactSlice"; // Adjust path to your store

// Import your image (Make sure to move the file to your assets folder)
import bgImage from "../assets/images/contact_page_bg.jpg"; 

const Contact = () => {
    const dispatch = useDispatch();
    const loading = useSelector(selectContactLoading);
    const success = useSelector(selectContactSuccess);
    const error = useSelector(selectContactError);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        message: ""
    });

    // Handle Input Change
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle Submit
    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Prepare payload for backend
        // Backend expects 'subject', so we pass phone number as the subject line
        const payload = {
            name: formData.name,
            email: formData.email,
            subject: `Inquiry from ${formData.phone}`, 
            message: formData.message
        };

        dispatch(submitContactForm(payload));
    };

    // Reset form on success
    useEffect(() => {
        if (success) {
            setFormData({ name: "", email: "", phone: "", message: "" });
            // Optional: Auto-hide success message after 5 seconds
            const timer = setTimeout(() => dispatch(resetContactState()), 5000);
            return () => clearTimeout(timer);
        }
    }, [success, dispatch]);

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans bg-[#f4f4f4]">
            
            {/* --- BACKGROUND IMAGE WITH DIMMING --- */}
            <div 
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transform scale-105"
                style={{ backgroundImage: `url('${bgImage}')` }}
            >
                {/* Light Overlay for Soft Frosted Look */}
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[4px]"></div>
            </div>

            {/* --- GLASS FORM CONTAINER --- */}
            <div className="relative z-10 w-full max-w-lg p-5 mt-10 lg:mt-0">
                
                {/* Header Text */}
                <div className="text-center mb-8">
                    {/* Light theme heading */}
                    <h1 className="text-4xl md:text-5xl font-bold text-[#0f0f0f] tracking-tight mb-2 drop-shadow-sm">
                        Get in Touch
                    </h1>
                    <p className="text-zinc-600 text-sm md:text-base font-medium">
                        Have a question? We'd love to hear from you.
                    </p>
                </div>

                {/* Form Card - Light Frosted Glass */}
                <div className="bg-white/60 backdrop-blur-xl border border-zinc-200/50 rounded-3xl p-4 md:p-6 shadow-xl shadow-black/5">
                    
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        
                        {/* Name Input */}
                        <div className="group">
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">
                                Name
                            </label>
                            <div className="relative">
                                {/* Matched focus icon color to brand red */}
                                <Icon icon="solar:user-bold" className="absolute left-4 top-3.5 text-zinc-400 text-lg group-focus-within:text-red-600 transition-colors" />
                                <input 
                                    type="text" 
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    // Light theme input fields
                                    className="w-full bg-white/80 border border-zinc-300/80 rounded-xl py-3 pl-12 pr-4 text-[#0f0f0f] placeholder-zinc-400 focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/50 transition-all shadow-sm"
                                    placeholder="Goku Son"
                                />
                            </div>
                        </div>

                        {/* Email Input */}
                        <div className="group">
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">
                                Email
                            </label>
                            <div className="relative">
                                <Icon icon="solar:letter-bold" className="absolute left-4 top-3.5 text-zinc-400 text-lg group-focus-within:text-red-600 transition-colors" />
                                <input 
                                    type="email" 
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-white/80 border border-zinc-300/80 rounded-xl py-3 pl-12 pr-4 text-[#0f0f0f] placeholder-zinc-400 focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/50 transition-all shadow-sm"
                                    placeholder="kamehameha@example.com"
                                />
                            </div>
                        </div>

                        {/* Phone Input */}
                        <div className="group">
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">
                                Phone No
                            </label>
                            <div className="relative">
                                <Icon icon="solar:phone-bold" className="absolute left-4 top-3.5 text-zinc-400 text-lg group-focus-within:text-red-600 transition-colors" />
                                <input 
                                    type="tel" 
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-white/80 border border-zinc-300/80 rounded-xl py-3 pl-12 pr-4 text-[#0f0f0f] placeholder-zinc-400 focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/50 transition-all shadow-sm"
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                        </div>

                        {/* Message Input */}
                        <div className="group">
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">
                                Message
                            </label>
                            <textarea 
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                rows="4"
                                className="w-full bg-white/80 border border-zinc-300/80 rounded-xl py-3 px-4 text-[#0f0f0f] placeholder-zinc-400 focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/50 transition-all resize-none shadow-sm"
                                placeholder="How can we help you level up?"
                            ></textarea>
                        </div>

                        {/* Status Messages */}
                        {error && (
                            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-sm flex items-center gap-2">
                                <Icon icon="solar:danger-circle-bold" /> {error}
                            </div>
                        )}
                        {success && (
                            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm flex items-center gap-2">
                                <Icon icon="solar:check-circle-bold" /> Message sent successfully!
                            </div>
                        )}

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full mt-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Icon icon="line-md:loading-twotone-loop" className="text-xl" />
                            ) : (
                                <>
                                    Send Message <Icon icon="solar:plain-3-bold" />
                                </>
                            )}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default Contact;