import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, useDayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

// Nav dirender di dalam DayPicker tapi kita sembunyikan default-nya,
// lalu inject tombol prev/next ke MonthCaption tiap bulan.
function CustomMonthCaption(
  props: React.HTMLAttributes<HTMLDivElement> & {
    calendarMonth: { date: Date };
    displayIndex: number;
  },
) {
  const { calendarMonth, displayIndex, ...rest } = props;
  const {
    nextMonth,
    previousMonth,
    goToMonth,
    formatters: { formatMonthCaption },
    locale,
    months,
  } = useDayPicker();

  const isFirst = displayIndex === 0;
  const isLast = displayIndex === months.length - 1;

  return (
    <div {...rest} className="relative flex items-center justify-center h-9 px-8">
      {isFirst && (
        <button
          type="button"
          onClick={() => previousMonth && goToMonth(previousMonth)}
          disabled={!previousMonth}
          aria-disabled={!previousMonth}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "absolute left-0 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 disabled:opacity-20",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <span className="text-sm font-medium">
        {formatMonthCaption(calendarMonth.date, { locale })}
      </span>

      {isLast && (
        <button
          type="button"
          onClick={() => nextMonth && goToMonth(nextMonth)}
          disabled={!nextMonth}
          aria-disabled={!nextMonth}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "absolute right-0 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 disabled:opacity-20",
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// Sembunyikan Nav bawaan karena sudah digantikan CustomMonthCaption
function HiddenNav() {
  return null;
}

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "hidden",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
        week: "flex w-full mt-2",
        day: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-none",
        ),
        range_start: "bg-accent rounded-l-md [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
        range_end: "day-range-end bg-accent rounded-r-md [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent text-accent-foreground",
        outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        disabled: "text-muted-foreground opacity-50",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Nav: HiddenNav,
        MonthCaption: CustomMonthCaption as React.ComponentType<
          React.HTMLAttributes<HTMLDivElement>
        >,
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
