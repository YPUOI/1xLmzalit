import React, { useState } from 'react';
import { 
  Trophy, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Target, 
  Award, 
  ShieldCheck, 
  Zap, 
  ChevronRight, 
  ChevronLeft,
  Flame,
  HelpCircle,
  Users
} from 'lucide-react';

interface RulesSlideProps {
  onStartPredicting?: () => void;
}

export const RulesSlide: React.FC<RulesSlideProps> = ({ onStartPredicting }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 'points',
      title: 'نظام احتساب وتوزيع النقاط',
      subtitle: 'كيف تجمع أكبر قدر من النقاط في كل مباراة؟',
      icon: Trophy,
      badge: 'النقاط الرسمية',
      color: 'from-amber-500/20 to-yellow-500/5',
      borderColor: 'border-yellow-500/30',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            
            {/* Exact Score */}
            <div className="bg-[#080C19]/80 border border-yellow-500/40 rounded-2xl p-4 relative overflow-hidden group hover:border-yellow-400 transition">
              <div className="absolute top-0 left-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-black text-yellow-400">
                  <Target className="w-4 h-4 text-yellow-400" />
                  النتيجة الدقيقة
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 text-xs font-black">
                  +5 نقاط
                </span>
              </div>
              <p className="text-xs text-[#E2E8F0] leading-relaxed">
                توقع النتيجة الصحيحة التامة للمباراة (مثال: توقع 2 - 1 وانتهت المباراة فعلياً 2 - 1).
              </p>
            </div>

            {/* MVP / Best Player */}
            <div className="bg-[#080C19]/80 border border-purple-500/40 rounded-2xl p-4 relative overflow-hidden group hover:border-purple-400 transition">
              <div className="absolute top-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-black text-purple-300">
                  <Award className="w-4 h-4 text-purple-400" />
                  رجل المباراة (MVP)
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-purple-400/20 border border-purple-400/40 text-purple-200 text-xs font-black">
                  +3 نقاط
                </span>
              </div>
              <p className="text-xs text-[#E2E8F0] leading-relaxed">
                توقع صحيح لنجم اللقاء المعتمد رسمياً من الاتحاد الأوروبي لكرة القدم UEFA.
              </p>
            </div>

            {/* Goal Scorer */}
            <div className="bg-[#080C19]/80 border border-emerald-500/40 rounded-2xl p-4 relative overflow-hidden group hover:border-emerald-400 transition">
              <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-black text-emerald-400">
                  <Flame className="w-4 h-4 text-emerald-400" />
                  توقع مسجلي الأهداف
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 text-xs font-black">
                  +1 نقطة / هدف
                </span>
              </div>
              <p className="text-xs text-[#E2E8F0] leading-relaxed">
                نقطة واحدة لكل لاعب اخترته ونجح في تسجيل هدف حقيقي في المباراة (الوقت الأصلي والإضافي).
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-transparent rounded-2xl border border-yellow-500/20 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-yellow-400 shrink-0" />
            <p className="text-xs text-[#E2E8F0] font-medium leading-relaxed">
              <strong>مثال كامل لحصد 10 نقاط:</strong> إذا توقعت فوز الريال 2-1 بهدفي مبابي وفينيسيوس مع فينيسيوس كرجل المباراة (MVP)، وتحققت جميعها: <strong>5 (نتيجة دقيقة) + 1 (مبابي) + 1 (فينيسيوس) + 3 (رجل المباراة) = 10 نقاط كاملة!</strong>
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'deadlines',
      title: 'مواعيد وإغلاق باب التوقعات',
      subtitle: 'التوقيت الدقيق لإرسال وتعديل التوقعات',
      icon: Clock,
      badge: 'الشفافية والنزاهة',
      color: 'from-blue-500/20 to-cyan-500/5',
      borderColor: 'border-cyan-500/30',
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="bg-[#080C19]/80 border border-slate-800 rounded-2xl p-4 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-[#00E5FF] shrink-0 mt-0.5">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">الإغلاق التلقائي الصارم (Deadline)</h4>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  يُقفل باب تسجيل وتعديل التوقعات تلقائياً مع حلول الدقيقة المحددة لانطلاق صافرة بداية المباراة. لا يمكن قبول أي توقع بعد انتهاء المهلة.
                </p>
              </div>
            </div>

            <div className="bg-[#080C19]/80 border border-slate-800 rounded-2xl p-4 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">حرية التعديل قبل الموعد</h4>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  يحق لكل متسابق تعديل توقعه عدة مرات بحرية تامة طالما أن المباراة ما زالت مفتوحة (حالة OPEN) وقبل حلول موعد الإغلاق.
                </p>
              </div>
            </div>

            <div className="bg-[#080C19]/80 border border-slate-800 rounded-2xl p-4 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">الشفافية وكشف التوقعات</h4>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  بمجرد إغلاق المباراة وبدء اللقاء، تصبح توقعات جميع الأصدقاء ظاهرة للعيان لضمان العدالة وتفادي أي شبهة تعديل أثناء سير المباراة.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'tiebreak',
      title: 'معايير كسر التعادل في الترتيب',
      subtitle: 'كيف يُحسم الفائز بالمركز الأول عند تساوي النقاط؟',
      icon: Award,
      badge: 'قواعد الترتيب',
      color: 'from-amber-500/20 to-rose-500/5',
      borderColor: 'border-amber-500/30',
      content: (
        <div className="space-y-3.5">
          <p className="text-xs text-[#94A3B8]">
            في حال تساوى متسابقان أو أكثر في رصيد النقاط الإجمالي، يتم اللجوء للمعايير التالية بالتسلسل:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-[#080C19]/80 border border-amber-500/30 rounded-2xl p-4 text-center">
              <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center mx-auto mb-2">
                1
              </span>
              <h5 className="text-xs font-black text-white mb-1">النتائج الدقيقة</h5>
              <p className="text-[11px] text-[#94A3B8]">
                الأفضلية لصاحب أكبر عدد من النتائج الدقيقة المكتملة (+5).
              </p>
            </div>

            <div className="bg-[#080C19]/80 border border-purple-500/30 rounded-2xl p-4 text-center">
              <span className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-300 font-black text-xs flex items-center justify-center mx-auto mb-2">
                2
              </span>
              <h5 className="text-xs font-black text-white mb-1">توقع رجل المباراة (MVP)</h5>
              <p className="text-[11px] text-[#94A3B8]">
                الأفضلية للمتسابق الأكثر نجاحاً في توقع نجوم المباريات (+3).
              </p>
            </div>

            <div className="bg-[#080C19]/80 border border-cyan-500/30 rounded-2xl p-4 text-center">
              <span className="w-7 h-7 rounded-full bg-cyan-500/20 text-[#00E5FF] font-black text-xs flex items-center justify-center mx-auto mb-2">
                3
              </span>
              <h5 className="text-xs font-black text-white mb-1">توقع مسجلي الأهداف</h5>
              <p className="text-[11px] text-[#94A3B8]">
                الأفضلية للمتسابق الذي أصاب أكبر عدد من مسجلي الأهداف الصحيحة.
              </p>
            </div>

            <div className="bg-[#080C19]/80 border border-emerald-500/30 rounded-2xl p-4 text-center">
              <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center mx-auto mb-2">
                4
              </span>
              <h5 className="text-xs font-black text-white mb-1">أسبقية تاريخ إنشاء الحساب</h5>
              <p className="text-[11px] text-[#94A3B8]">
                في حال استمرار التعادل، يتم اعتماد أسبقية تاريخ تسجيل الحساب على المنصة.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'fairplay',
      title: 'ميثاق الشرف وروح المزاليط',
      subtitle: 'قواعد المشاركة بين الأصدقاء وحماية المنصة',
      icon: ShieldCheck,
      badge: 'ميثاق الأصدقاء',
      color: 'from-emerald-500/20 to-teal-500/5',
      borderColor: 'border-emerald-500/30',
      content: (
        <div className="space-y-4">
          <div className="bg-[#080C19]/80 border border-emerald-500/30 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 text-emerald-400 font-black text-sm mb-2">
              <Users className="w-4 h-4" />
              <span>مجتمع الأصدقاء فقط (Private Circle)</span>
            </div>
            <p className="text-xs text-[#E2E8F0] leading-relaxed mb-3">
              المنصة مخصصة للأصدقاء المقربين فقط؛ يُمنع مشاركة كلمة مرور الدخول مع أي شخص غير معتمد من إدارة <strong>1xLmzalit</strong>.
            </p>
            <ul className="text-xs text-[#94A3B8] space-y-2 list-disc list-inside">
              <li>سياسة الحساب الواحد: حساب واحد فقط لكل جهاز لضمان تكافؤ الفرص.</li>
              <li>الاحترام المتبادل والروح الرياضية العالية طيلة أطوار دوري أبطال أوروبا 2026/2027.</li>
              <li>القرار النهائي في حسم النقاط يعتمد على تقارير المباريات الرسمية الصادرة من الاتحاد الأوروبي لكرة القدم UEFA.</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const current = slides[currentSlide];
  const Icon = current.icon;

  const handleNext = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Slide Navigation Tabs / Pills */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
        {slides.map((slide, idx) => {
          const SlideIcon = slide.icon;
          const isActive = idx === currentSlide;
          return (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(idx)}
              className={`py-2 px-3.5 sm:px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#00E5FF] text-slate-950 shadow-lg shadow-cyan-500/20 scale-[1.02]'
                  : 'bg-[#10172A] text-[#94A3B8] hover:text-white border border-slate-800'
              }`}
            >
              <SlideIcon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-[#00E5FF]'}`} />
              <span>{slide.badge}</span>
            </button>
          );
        })}
      </div>

      {/* Main Active Slide Card */}
      <div className={`bg-[#10172A] border ${current.borderColor} rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl transition-all duration-300`}>
        
        {/* Background glow orb */}
        <div className={`absolute top-0 right-0 w-80 h-80 bg-gradient-to-br ${current.color} rounded-full blur-3xl pointer-events-none`} />

        {/* Header Block */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#080C19] border border-slate-800 text-[11px] font-black text-[#00E5FF] mb-2">
              <Icon className="w-3.5 h-3.5" />
              <span>الشريحة {currentSlide + 1} من {slides.length}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">{current.title}</h2>
            <p className="text-xs text-[#94A3B8] mt-1">{current.subtitle}</p>
          </div>

          {/* Next / Previous arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              aria-label="الشريحة السابقة"
              className="w-10 h-10 rounded-xl bg-[#080C19] border border-slate-800 hover:border-slate-700 text-[#94A3B8] hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              aria-label="الشريحة التالية"
              className="w-10 h-10 rounded-xl bg-[#080C19] border border-slate-800 hover:border-slate-700 text-[#94A3B8] hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slide Body */}
        <div className="relative z-10">
          {current.content}
        </div>

        {/* Footer Slide Stepper & Action */}
        <div className="mt-8 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentSlide ? 'w-8 bg-[#00E5FF]' : 'w-2 bg-slate-800 hover:bg-slate-700'
                }`}
                title={`الانتقال للشريحة ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {currentSlide < slides.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer"
              >
                <span>الشريحة التالية</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : null}

            {onStartPredicting && (
              <button
                onClick={onStartPredicting}
                className="px-5 py-2.5 rounded-xl bg-[#00E5FF] hover:bg-cyan-400 text-slate-950 font-black text-xs transition shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer"
              >
                <Trophy className="w-4 h-4" />
                <span>ابدأ التوقع الآن</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
